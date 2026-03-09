import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import { rootSaga } from './rootSaga'
import sessionReducer from './slices/sessionSlice'
import configReducer from './slices/configSlice'
import notesReducer from './slices/notesSlice'
import { bindAiSagaStore } from './sagas/aiSaga'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
    reducer: {
        sessions: sessionReducer,
        config: configReducer,
        notes: notesReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
})

bindAiSagaStore(store)
sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
