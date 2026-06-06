"use client";

import { useEffect, useRef } from "react";
import { recordSubmissionView } from "@/actions/submissions/views";

/** 마운트 시 1회만 열람 기록 액션을 호출한다. 실패는 조용히 무시(부가 기능). */
export function RecordView({ submissionId }: { submissionId: number }) {
	const fired = useRef(false);
	useEffect(() => {
		if (fired.current) return;
		fired.current = true;
		void recordSubmissionView(submissionId).catch(() => {});
	}, [submissionId]);
	return null;
}
