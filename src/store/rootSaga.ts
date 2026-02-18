import { all } from 'redux-saga/effects'
import { aiSaga } from './sagas/aiSaga'
import { persistenceSaga } from './sagas/persistenceSaga'

export function* rootSaga() {
    yield all([
        aiSaga(),
        persistenceSaga(),
    ])
}
