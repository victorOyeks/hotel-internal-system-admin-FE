export type BulkUploadResult = {
	summary: {
		totalRows: number;
		successCount: number;
		failedCount: number;
		processingTimeMs: number;
		fileName: string;
		uploadedBy: string;
		uploadedAt: string;
	};
	results: Array<{
		rowNumber: number;
		success: boolean;
		itemIdentifier: string | null;
		errorMessage: string | null;
	}>;
};
