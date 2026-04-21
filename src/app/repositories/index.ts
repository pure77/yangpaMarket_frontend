import { httpRepository } from "./httpRepository";
import { mockRepository } from "./mockRepository";

export type RepositoryMode = "mock" | "http";

const ACTIVE_MODE: RepositoryMode = "mock";

export const repositories = ACTIVE_MODE === "mock" ? mockRepository : httpRepository;
