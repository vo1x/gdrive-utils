import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "sonner";

import { Navbar } from "@/components/navbar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Cloudfiler",
	description: "Generate WordPress code for https://uhdmovies.fyi",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}

				<Toaster
					richColors
					theme="dark"
					position="top-right"
					toastOptions={{
						style: {
							marginTop: "3rem",
							fontSize: "16px",
						},
					}}
					closeButton
				/>
			</body>
		</html>
	);
}
