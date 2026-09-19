import { serverConfig } from "./config";
import { createHmac, createPrivateKey, createPublicKey } from "crypto";
import { exportJWK, importPKCS8, importJWK, type CryptoKey } from "jose";

const KEY_ID = "cubedev-es256";
const DERIVE_INFO = "cubedev-convex-es256-v1";

function requireJwtSecret(): string {
  const secret = serverConfig.jwtSecretKey;
  if (secret.length < 32) {
    throw new Error("JWT_SECRET_KEY must be at least 32 characters");
  }
  return secret;
}

function deriveScalar(secret: string): Buffer {
  return createHmac("sha256", secret).update(DERIVE_INFO).digest();
}

function encodeLength(len: number): Buffer {
  if (len < 128) {
    return Buffer.from([len]);
  }
  if (len < 256) {
    return Buffer.from([0x81, len]);
  }
  return Buffer.from([0x82, (len >> 8) & 0xff, len & 0xff]);
}

function encodeSeq(contents: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from([0x30]),
    encodeLength(contents.length),
    contents,
  ]);
}

function encodeOctetString(data: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from([0x04]),
    encodeLength(data.length),
    data,
  ]);
}

const OID_EC_PUBLIC_KEY = Buffer.from([
  0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
]);
const OID_P256 = Buffer.from([
  0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
]);

function pkcs8FromP256Scalar(scalar: Buffer): Buffer {
  const d = Buffer.from(scalar);
  if (d.length !== 32) {
    throw new Error("P-256 private scalar must be 32 bytes");
  }

  const ecPrivateKey = encodeSeq(
    Buffer.concat([
      Buffer.from([0x02, 0x01, 0x01]),
      encodeOctetString(d),
      Buffer.concat([
        Buffer.from([0xa0]),
        encodeLength(OID_P256.length),
        OID_P256,
      ]),
    ]),
  );

  return encodeSeq(
    Buffer.concat([
      Buffer.from([0x02, 0x01, 0x00]),
      encodeSeq(Buffer.concat([OID_EC_PUBLIC_KEY, OID_P256])),
      encodeOctetString(ecPrivateKey),
    ]),
  );
}

function loadPrivateKeyFromEnvPem(): CryptoKey | Promise<CryptoKey> | null {
  const pem = serverConfig.convexAuthPrivateKey;
  if (!pem) {
    return null;
  }
  return importPKCS8(pem.replace(/\\n/g, "\n"), "ES256");
}

function loadPrivateKeyFromSecret(): CryptoKey {
  const der = pkcs8FromP256Scalar(deriveScalar(requireJwtSecret()));
  const keyObject = createPrivateKey({
    key: der,
    format: "der",
    type: "pkcs8",
  });
  return keyObject as unknown as CryptoKey;
}

export async function getConvexSigningKey(): Promise<CryptoKey> {
  const fromPem = loadPrivateKeyFromEnvPem();
  if (fromPem) {
    return fromPem;
  }
  return loadPrivateKeyFromSecret();
}

export async function getConvexPublicJwk(): Promise<Record<string, unknown>> {
  const fromPem = loadPrivateKeyFromEnvPem();
  let publicKey;
  if (fromPem) {
    const privateKey = await fromPem;
    const pemExport = await exportJWK(privateKey);
    publicKey = pemExport;
  } else {
    const privateKey = createPrivateKey({
      key: pkcs8FromP256Scalar(deriveScalar(requireJwtSecret())),
      format: "der",
      type: "pkcs8",
    });
    publicKey = createPublicKey(privateKey).export({ format: "jwk" });
  }

  const { d: _private, ...pub } = publicKey as Record<string, unknown>;
  return {
    ...pub,
    kid: KEY_ID,
    alg: "ES256",
    use: "sig",
  };
}

export async function getConvexJwks() {
  const jwk = await getConvexPublicJwk();
  return { keys: [jwk] };
}

export function getConvexKeyId() {
  return KEY_ID;
}

export async function importPublicVerifyKey() {
  const jwk = await getConvexPublicJwk();
  return importJWK(jwk, "ES256");
}
