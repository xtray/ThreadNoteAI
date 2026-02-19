import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Note {
    id: string;
    title: string;
    fileName: string;
    content: string;
    updatedAt: number;
}

export interface NotesState {
    notes: Record<string, Note>;
    activeNoteId: string | null;
}

const initialState: NotesState = {
    notes: {},
    activeNoteId: null,
}

const notesSlice = createSlice({
    name: 'notes',
    initialState,
    reducers: {
        loadNotes: (state, action: PayloadAction<Record<string, Note>>) => {
            state.notes = action.payload;
            if (state.activeNoteId && !state.notes[state.activeNoteId]) {
                state.activeNoteId = null;
            }
        },
        upsertNote: (state, action: PayloadAction<Note>) => {
            state.notes[action.payload.id] = action.payload;
            state.activeNoteId = action.payload.id;
        },
        setActiveNoteId: (state, action: PayloadAction<string | null>) => {
            state.activeNoteId = action.payload;
        },
    },
})

export const { loadNotes, upsertNote, setActiveNoteId } = notesSlice.actions
export default notesSlice.reducer
