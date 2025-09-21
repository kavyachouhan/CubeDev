import React from "react";
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Cube Lab | CubeDev',
    description: 'Explore various tools and features in Cube Lab to enhance your speedcubing experience. Try out our timer, statistics, and more.',
    keywords: ['speedcubing', 'rubiks cube', 'algorithms', 'virtual cube', 'cube simulator', 'practice'],
    openGraph: {
        title: 'Cube Lab | CubeDev',
        description: 'Explore various tools and features in Cube Lab to enhance your speedcubing experience. Try out our timer, statistics, and more.',
        url: 'https://cubedev.xyz/cube-lab',
        siteName: 'CubeDev',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Cube Lab | CubeDev',
        description: 'Explore various tools and features in Cube Lab to enhance your speedcubing experience. Try out our timer, statistics, and more.',
    },
}

export default function CubeLabLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}