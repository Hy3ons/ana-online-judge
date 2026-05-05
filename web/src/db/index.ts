import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

// dev hot-reload가 module을 재평가할 때마다 새 postgres client가 만들어져
// connection이 누적되는 것을 방지하기 위해 globalThis에 캐시한다.
const globalForDb = globalThis as unknown as {
	__queryClient?: ReturnType<typeof postgres>;
};

const queryClient =
	globalForDb.__queryClient ??
	postgres(serverEnv.DATABASE_URL, {
		max: 10,
		idle_timeout: 30,
	});

if (serverEnv.NODE_ENV !== "production") {
	globalForDb.__queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

export * from "./schema";
