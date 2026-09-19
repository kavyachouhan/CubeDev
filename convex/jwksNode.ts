"use node";

import { internalAction } from "./_generated/server";
import { createHmac, createPrivateKey, createPublicKey } from "crypto";
import { convexConfig } from "./config";

const KEY_ID = "cubedev-es256";
const DERIVE_INFO = "cubedev-convex-es256-v1";

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

export const getPublicJwks = internalAction({
  args: {},
  handler: async () => {
    const secret = convexConfig.jwtSecretKey;
    if (secret.length < 32) {
      throw new Error("JWT_SECRET_KEY must be at least 32 characters");
    }

    const scalar = createHmac("sha256", secret).update(DERIVE_INFO).digest();
    const privateKey = createPrivateKey({
      key: pkcs8FromP256Scalar(scalar),
      format: "der",
      type: "pkcs8",
    });
    const pub = createPublicKey(privateKey).export({ format: "jwk" });

    return {
      keys: [
        {
          kty: pub.kty,
          crv: pub.crv,
          x: pub.x,
          y: pub.y,
          kid: KEY_ID,
          alg: "ES256",
          use: "sig",
        },
      ],
    };
  },
});