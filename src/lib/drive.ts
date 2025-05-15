const BASE_URL = "https://www.googleapis.com/drive/v3/files";

interface FetchOptions {
	method?: string;
	headers: Record<string, string>;
	body?: string;
}

interface Session {
	name?: string | null;
	email?: string | null;
	image?: string | null;
	accessToken?: string;
}

interface FileInfo {
	id: string;
	name: string;
	size: number;
	mimeType: string;
	webContentLink: string;
}

interface FolderInfo extends FileInfo {
	subfolders?: {
		id: string;
		name: string;
		webContentLink: string;
	}[];
}

export const delay = async (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

async function fetchWithRetry(
	url: string,
	options: FetchOptions,
	retries = 3,
	delayMs = 1000,
): Promise<any> {
	for (let i = 0; i < retries; i++) {
		console.log(`Fetching: ${url} (Attempt ${i + 1}/${retries})`);
		const response = await fetch(url, options);

		if (response.ok) return response.json();

		const responseText = await response.text();
		console.warn(
			`Retrying request (${i + 1}/${retries})... Status: ${response.status} ${
				response.statusText
			}\nResponse: ${responseText}`,
		);

		await delay(delayMs * Math.pow(2, i));
	}
	throw new Error("Failed after multiple retries");
}

async function getHeaders(session: Session): Promise<Record<string, string>> {
	return {
		Authorization: `Bearer ${session.accessToken}`,
		Accept: "application/json",
		"Content-Type": "application/json",
	};
}

export const getFileInfo = async (
	session: Session,
	fileId: string,
): Promise<FileInfo> => {
	const url = `${BASE_URL}/${fileId}?fields=id,name,size,mimeType,webContentLink&includeItemsFromAllDrives=true&supportsAllDrives=true`;

	const response = await fetch(url, {
		headers: await getHeaders(session),
	});

	const fileInfo = await response.json();
	return fileInfo;
};

export async function getFolderContents(
	session: Session,
	folderId: string,
): Promise<FileInfo[]> {
	const files: FileInfo[] = [];
	let pageToken: string | null = null;

	do {
		const url = `${BASE_URL}?q='${folderId}'+in+parents&fields=files(id,name,size,mimeType,webContentLink),nextPageToken&includeItemsFromAllDrives=true&supportsAllDrives=true&orderBy=name`;
		const response = await fetchWithRetry(url, {
			headers: await getHeaders(session),
		});
		files.push(...response.files);
		pageToken = response.nextPageToken || null;
	} while (pageToken);

	return files;
}

export async function getFolderContentsWithSubfolders(
	session: Session,
	folderId: string,
): Promise<{ files: FileInfo[]; subfolders: FileInfo[] }> {
	const files: FileInfo[] = [];
	const subfolders: FileInfo[] = [];
	let pageToken: string | null = null;

	do {
		const url = `${BASE_URL}?q='${folderId}'+in+parents&fields=files(id,name,size,mimeType,webContentLink),nextPageToken&includeItemsFromAllDrives=true&supportsAllDrives=true&orderBy=name`;
		const response = await fetch(url, {
			headers: await getHeaders(session),
		});

		const data = await response.json();

		const fetchedItems = data.files.filter(
			(item: FileInfo) =>
				item.mimeType !== "application/vnd.google-apps.folder",
		);

		const fetchedSubfolders = data.files.filter(
			(item: FileInfo) =>
				item.mimeType === "application/vnd.google-apps.folder",
		);

		files.push(...fetchedItems);
		subfolders.push(...fetchedSubfolders);

		pageToken = data.nextPageToken || null;
	} while (pageToken);

	return { files, subfolders };
}

export async function refreshAccessToken(
	refreshToken: string,
): Promise<{ accessToken: string; expiresAt: number } | null> {
	try {
		const response = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: process.env.AUTH_GOOGLE_CLIENT_ID!,
				client_secret: process.env.AUTH_GOOGLE_CLIENT_SECRET!,
				refresh_token: refreshToken,
				grant_type: "refresh_token",
			}),
		});

		const tokens = await response.json();

		if (!response.ok) {
			console.error("❌ Failed to refresh token:", tokens);
			throw tokens;
		}

		const expiresAt = Date.now() + tokens.expires_in * 1000;

		return {
			accessToken: tokens.access_token,
			expiresAt,
		};
	} catch (error) {
		console.error("🚨 Error refreshing access token:", error);
		return null;
	}
}

export async function renameFile(
  session: Session,
  fileId: string,
  newName: string,
): Promise<FileInfo> {
  const url = `${BASE_URL}/${fileId}?fields=id,name,size,mimeType,webContentLink&includeItemsFromAllDrives=true&supportsAllDrives=true`;

  const response = await fetch(url, {
      method: "PATCH",
      headers: await getHeaders(session),
      body: JSON.stringify({ name: newName }),
  });

  if (!response.ok) {
      const errorText = await response.text();
	  console.log("error from rename function: ",errorText)
      throw new Error(`Failed to rename file: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const fileInfo = await response.json();
  return fileInfo;
}