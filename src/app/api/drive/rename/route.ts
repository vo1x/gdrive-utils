import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";

import { renameFile } from "@/lib/drive";

export const PATCH = async (request: NextRequest) => {
	const session = await auth();
	if (!session)
		return NextResponse.json({ message: "Not authorized" }, { status: 403 });

	const { searchParams } = new URL(request.url);
	const mimeId = searchParams.get("mimeId");

	if (!mimeId)
		return NextResponse.json(
			{ message: "File or Folder ID is required" },
			{ status: 404 },
		);

	const { newName } = await request.json();
	if (!newName)
		return NextResponse.json(
			{ message: "New file name is required" },
			{ status: 400 },
		);

	try {
		const renamedFile = await renameFile(session.user, mimeId, newName);
		return NextResponse.json(renamedFile, { status: 200 });
	} catch (error: any) {
	  console.log("error from rename function: ",error.message)

		return NextResponse.json(
			{ message: error.message || "Failed to rename file" },
			{ status: 500 },
		);
	}
};
