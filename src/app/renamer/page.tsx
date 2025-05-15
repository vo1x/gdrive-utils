"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
	Loader,
	CheckCircle2,
	XCircle,
	Circle,
	Upload,
	ChevronRight,
} from "lucide-react";

import React from "react";

import { extractId } from "@/lib/parser";


import { diffChars } from "diff";

interface FileProcessStatus {
	id: string;
	name: string;
	size: number;
	status: "pending" | "processing" | "completed" | "error";
	gdFlixUrl?: string;
}


export default function Renamer() {
	const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (inputRef.current) {
			const handleFocus = () => setIsInputFocused(true);
			const handleBlur = () => setIsInputFocused(false);

			const inputElement = inputRef.current;
			inputElement.addEventListener("focus", handleFocus);
			inputElement.addEventListener("blur", handleBlur);

			return () => {
				inputElement.removeEventListener("focus", handleFocus);
				inputElement.removeEventListener("blur", handleBlur);
			};
		}
	}, [inputRef]);
	const [driveData, setDriveData] = useState<any[]>([]);
	const [fileProcessStatuses, setFileProcessStatuses] = useState<
		FileProcessStatus[]
	>([]);

	const [isExtracting, setIsExtracting] = useState<boolean>(false);
	const [isError, setIsError] = useState<boolean>(false);
	const [isExtracted, setIsExtracted] = useState<boolean>(false);
	const [isRenaming, setIsRenaming] = useState(false);

	const [inputValue, setInputValue] = useState<string>("");

	function highlightDiff(oldName: string, newName: string) {
		const diff = diffChars(oldName, newName);

		console.log(diff);

		const oldHighlighted = (
			<>
				{diff.map((part, i) =>
					part.removed ? (
						<span
							key={i}
							className="bg-red-500/30 text-red-400 font-bold rounded px-1"
						>
							{part.value}
						</span>
					) : !part.added ? (
						<span key={i}>{part.value}</span>
					) : null,
				)}
			</>
		);

		const newHighlighted = (
			<>
				{diff.map((part, i) =>
					part.added ? (
						<span
							key={i}
							className="bg-yellow-400/30 text-yellow-300 font-bold rounded px-1"
						>
							{part.value}
						</span>
					) : !part.removed ? (
						<span key={i}>{part.value}</span>
					) : null,
				)}
			</>
		);

		return { oldHighlighted, newHighlighted };
	}

	const [logsVisible, setLogsVisible] = useState<boolean>(true);

	const handleListButton = async () => {
		const driveUrl = inputValue;
		if (!driveUrl || driveUrl === "") {
			toast.error("Please enter a google drive URL");
			return;
		}

		const mimeId = extractId(driveUrl);

		if (!mimeId) {
			console.error("Invalid Google Drive ID or link");
			toast.error("Invalid Google Drive ID or link");
			return;
		}

		try {
			setLogsVisible(true);
			setIsError(false);
			setIsExtracted(false);
			setFileProcessStatuses([]);
			setIsExtracting(true);

			const folderData = await fetch(`api/drive/list?mimeId=${mimeId}`).then(
				(res) => res.json(),
			);

			if (folderData) {
				setIsExtracting(false);
				setIsExtracted(true);

				const files = folderData.files;
				setDriveData(files);
			} else {
				throw new Error("Unable to extract folder or file");
			}
		} catch (error) {
			setIsExtracting(false);
			setIsError(true);
			console.error(error);
		}
	};

	const getStatusIcon = (status: FileProcessStatus["status"]) => {
		switch (status) {
			case "pending":
				return <Circle className="text-slate-400" size={24} />;
			case "processing":
				return <Loader className="animate-spin text-blue-500" />;
			case "completed":
				return (
					<CheckCircle2 stroke="#02B063" fill="#02B063" fillOpacity="25%" />
				);
			case "error":
				return <XCircle stroke="#ef4444" fill="#ef4444" fillOpacity="25%" />;
		}
	};



	
	const [findStr, setFindStr] = useState("");
	const [replaceStr, setReplaceStr] = useState("");
	const [appendStr, setAppendStr] = useState("");

	const handleRenameAll = async () => {
		if (driveData.length === 0) {
			toast.error("No files to rename");
			return;
		}

		setIsRenaming(true);

		try {
			const renameOperations = driveData
				.map((file) => {
					let newName = findStr
						? file.name.replaceAll(findStr, replaceStr)
						: file.name;

					if (appendStr) {
						const lastDotIndex = newName.lastIndexOf(".");
						if (lastDotIndex !== -1) {
							const nameWithoutExt = newName.substring(0, lastDotIndex);
							const extension = newName.substring(lastDotIndex);
							newName = nameWithoutExt + appendStr + extension;
						} else {
							newName = newName + appendStr;
						}
					}

					return {
						fileId: file.id,
						oldName: file.name,
						newName: newName,
					};
				})
				.filter((op) => op.oldName !== op.newName); 

			if (renameOperations.length === 0) {
				toast.info("No files need renaming");
				setIsRenaming(false);
				return;
			}

			for (const op of renameOperations) {				
				const processId = `${op.fileId}_${Date.now()}`; 
				setFileProcessStatuses((prev) => [
					...prev,
					{
						id: processId, 
						name: op.oldName,
						size: 0, 
						status: "processing",
					},
				]);

				try {					
					const response = await fetch(`api/drive/rename?mimeId=${op.fileId}`, {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							newName: op.newName,
						}),
					});

					if (!response.ok) {
						throw new Error(`Failed to rename ${op.oldName}`);
					}				
					setFileProcessStatuses((prev) =>
						prev.map((file) =>
							file.id === processId
								? { ...file, status: "completed", name: op.newName }
								: file
						),
					);

					
					setDriveData((prev) =>
						prev.map((file) =>
							file.id === op.fileId ? { ...file, name: op.newName } : file,
						),
					);

					toast.success(`Renamed: ${op.oldName} → ${op.newName}`);
				} catch (error) {
					console.error(`Error renaming ${op.oldName}:`, error);					
					setFileProcessStatuses((prev) =>
						prev.map((file) =>
							file.id === processId ? { ...file, status: "error" } : file,
						),
					);

					toast.error(`Failed to rename ${op.oldName}`);
				}

				await new Promise((resolve) => setTimeout(resolve, 300));
			}

		} catch (error) {
			console.error("Error in rename all operation:", error);
			toast.error("Failed to complete rename operation");
		} finally {
			setIsRenaming(false);
		}
	};

	return (
		<>
		
			<div className=" flex items-center justify-center p-4">
				<div className="flex flex-col items-center gap-8 w-full max-w-2xl ">
					<div className="flex items-center justify-center gap-2 w-max border border-slate-700 bg-[#161B2E] p-2 px-3 rounded-full">
						<motion.input
							ref={inputRef}
							value={inputValue}
							onChange={(e: any) => setInputValue(e.target.value)}
							initial={{ width: "24rem" }}
							animate={{
								width: isInputFocused ? "28rem" : "24rem",
								transition: { duration: 0.3 },
							}}
							type="text"
							className=" bg-[#0F131F] outline-none rounded-full text-lg p-2 px-4 w-full"
							placeholder="URL"
						/>
						<button
							onClick={handleListButton}
							className="p-2 bg-[#445173] text-slate-400 hover:text-slate-100 transition-all duration-200 rounded-full font-semibold"
						>
							<Upload></Upload>
						</button>
					</div>
					<div className="flex gap-4 mb-4">
						<input
							type="text"
							placeholder="Find"
							value={findStr}
							onChange={(e) => setFindStr(e.target.value)}
							className="bg-[#181e2e] border border-slate-700 rounded px-3 py-2 text-slate-200 w-40"
						/>
						<input
							type="text"
							placeholder="Replace"
							value={replaceStr}
							onChange={(e) => setReplaceStr(e.target.value)}
							className="bg-[#181e2e] border border-slate-700 rounded px-3 py-2 text-slate-200 w-40"
						/>
						<input
							type="text"
							placeholder="Append before ext"
							value={appendStr}
							onChange={(e) => setAppendStr(e.target.value)}
							className="bg-[#181e2e] border border-slate-700 rounded px-3 py-2 text-slate-200 w-40"
						/>
					</div>
					
					<button
						onClick={handleRenameAll}
						disabled={isRenaming || driveData.length === 0}
						className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
							driveData.length === 0
								? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
								: isRenaming
								? "bg-blue-800/70 text-blue-300 cursor-wait"
								: "bg-blue-700 text-white hover:bg-blue-600"
						}`}
					>
						{isRenaming ? <Loader className="animate-spin h-4 w-4" /> : null}
						{isRenaming ? "Renaming..." : "Rename All Files"}
					</button>

					<div className="flex flex-col gap-4 max-w-2xl min-w-full">
						{isExtracting || isExtracted && (
							<motion.div
								initial={{ height: "max-content" }}
								animate={{ height: logsVisible ? "max-content" : "3.5rem" }}
								exit={{ height: "0" }}
								className={`bg-[#0C101C] flex flex-col overflow-hidden border p-4 px-0 rounded-xl border-slate-800`}
							>
								<div
									className={`flex items-center text-slate-300 px-4 pl-2 cursor-pointer  ${
										!logsVisible ? "pb-4" : ""
									}`}
									onClick={() => setLogsVisible((prev) => !prev)}
								>
									<ChevronRight></ChevronRight>
									<span className="font-semibold">Extraction Logs</span>
								</div>

								<div
									className={`w-full border-t my-2 border-slate-800 mb-4  ${
										!logsVisible ? "hidden" : ""
									}`}
								></div>

								<div className="flex items-center gap-2 mb-2 px-4">
									{isExtracting ? (
										<Loader className="animate-spin" />
									) : isExtracted && !isError ? (
										<CheckCircle2
											stroke="#02B063"
											fill="#02B063"
											fillOpacity={"25%"}
										/>
									) : (
										<XCircle
											stroke="#ef4444"
											fill="#ef4444"
											fillOpacity={"25%"}
										/>
									)}
									<span className="text-slate-400">
										Fetching folder contents from Google Drive
									</span>
								</div>

								{fileProcessStatuses.length > 0 && (
									<div className="flex flex-col px-4 gap-2">
										{fileProcessStatuses.map((file) => (
											<div
												key={file.id}
												className="flex items-center gap-2 text-md w-full"
											>
												<span>{getStatusIcon(file.status)}</span>
												<span className="truncate text-slate-400">
													{file.name}
												</span>
											</div>
										))}
									</div>
								)}
							</motion.div>
						)}

							{driveData.length>0 && 
							

						<div className="flex flex-col bg-[#0C101C] border  border-slate-800 p-4 pt-0 px-0 rounded-xl relative max-h-96 w-full overflow-y-auto">
							<div className="flex items-center justify-between text-slate-300 px-4 py-2 sticky top-0 z-10 bg-[#0C101C] border-b mb-4 border-slate-800">
								<span className="font-semibold">Folder Contents</span>
							</div>
							<div className="space-y-2 p-4">
								{driveData.map((file) => {
									let newName = findStr
										? file.name.replaceAll(findStr, replaceStr)
										: file.name;

									if (appendStr) {
										const lastDotIndex = newName.lastIndexOf(".");
										if (lastDotIndex !== -1) {
											const nameWithoutExt = newName.substring(
												0,
												lastDotIndex,
											);
											const extension = newName.substring(lastDotIndex);
											newName = nameWithoutExt + appendStr + extension;
										} else {
											newName = newName + appendStr;
										}
									}

									const changed = file.name !== newName;
									const highlighted = changed
										? highlightDiff(file.name, newName)
										: null;
									return (
										<div
											key={file.id}
											className={`flex flex-col gap-1 p-3 rounded-lg ${
												changed
													? "bg-[#232a3d] border border-yellow-700/30"
													: ""
											}`}
										>
											<div className="flex items-center gap-2">
												<span className="text-xs text-slate-500 w-16">Old:</span>
												<span className="">
													{highlighted?.oldHighlighted || (
														<span className="text-slate-400">{file.name}</span>
													)}
												</span>
											</div>
											<div className="flex items-center gap-2">
												<span className="text-xs text-slate-500 w-16">New:</span>
												<span className="">
													{highlighted?.newHighlighted || (
														<span className="text-slate-400">{file.name}</span>
													)}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
							}

					</div>
				</div>
			</div>
		</>
	);
}
