// Report draft persistence on the phone (PRD T08): killing the app keeps the draft.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDraftStore } from './draftCore';

export { emptyDraft, type ReportDraft } from './draftCore';

const store = createDraftStore(AsyncStorage);

export const loadDraft = store.load;
export const saveDraft = store.save;
export const clearDraft = store.clear;
