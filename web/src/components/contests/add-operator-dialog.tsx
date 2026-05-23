"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addOperatorToContest } from "@/actions/contests";
import { searchUsers } from "@/actions/contests/participants";
import { Button } from "@/components/ui/button";
import { UserSearchDialog, type UserSearchResult } from "@/components/user-search-dialog";

interface AddOperatorDialogProps {
	contestId: number;
	excludeIds?: number[];
}

export function AddOperatorDialog({ contestId, excludeIds }: AddOperatorDialogProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const handleAdd = async (user: UserSearchResult) => {
		await addOperatorToContest(contestId, user.id);
		router.refresh();
	};

	return (
		<>
			<Button onClick={() => setOpen(true)}>
				<UserPlus className="mr-2 h-4 w-4" />
				운영진 추가
			</Button>
			<UserSearchDialog
				open={open}
				onOpenChange={setOpen}
				title="운영진 추가"
				description="사용자 아이디나 이름을 검색하여 운영진를 추가하세요."
				searchAction={searchUsers}
				onSelect={handleAdd}
				excludeIds={excludeIds}
				closeOnSelect={false}
			/>
		</>
	);
}
