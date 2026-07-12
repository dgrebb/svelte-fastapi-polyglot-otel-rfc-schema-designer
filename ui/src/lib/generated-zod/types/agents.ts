// @generated — do not edit
import { z } from 'zod';

import {
	AgentSchema,
	AgentCreateSchema,
	AgentUpdateSchema
} from '../schemas/agents.js';

export type Agent = z.infer<typeof AgentSchema>;
export type AgentCreate = z.infer<typeof AgentCreateSchema>;
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>;
