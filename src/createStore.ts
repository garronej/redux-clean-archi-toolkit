import type {
    ConfigureStoreOptions,
    EnhancedStore,
    MiddlewareArray,
    ThunkMiddleware,
    AnyAction,
    ReducersMapObject
} from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import {
    usecasesToReducer,
    type UsecasesToReducer,
    type UsecaseLike as UsecaseLike_reducer
} from "./usecasesToReducer";
import {
    createMiddlewareEvtAction,
    type UsecaseToEvent,
    type UsecaseLike as UsecaseLike_evtMiddleware
} from "./middlewareEvtAction";
import type { NonPostableEvt } from "evt";

export type UsecaseLike = UsecaseLike_reducer & UsecaseLike_evtMiddleware;

export type GenericStore<
    ThunksExtraArgumentWithoutEvtAction extends Record<string, unknown>,
    Usecase extends UsecaseLike
> = {
    reducer: UsecasesToReducer<Usecase>;
    middleware: MiddlewareArray<
        [
            ThunkMiddleware<
                UsecasesToReducer<Usecase> extends ReducersMapObject<infer S, any> ? S : never,
                AnyAction,
                ThunksExtraArgumentWithoutEvtAction & {
                    evtAction: NonPostableEvt<UsecaseToEvent<Usecase>>;
                }
            >
        ]
    >;
} extends ConfigureStoreOptions<infer S, infer A, infer M>
    ? Pick<EnhancedStore<S, A, M>, "getState" | "dispatch"> & {
          evtAction: NonPostableEvt<UsecaseToEvent<Usecase>>;
      }
    : never;

export function createStore<
    ThunksExtraArgumentWithoutEvtAction extends Record<string, unknown>,
    Usecase extends UsecaseLike
>(params: {
    thunksExtraArgument: ThunksExtraArgumentWithoutEvtAction;
    usecasesArr: readonly Usecase[];
}): GenericStore<ThunksExtraArgumentWithoutEvtAction, Usecase> {
    const { thunksExtraArgument, usecasesArr } = params;

    const { evtAction, middlewareEvtAction } = createMiddlewareEvtAction(usecasesArr);

    //NOTE: We want to let the user change the properties, sometimes all the port
    //can't be ready at inception.
    Object.assign(thunksExtraArgument, { evtAction });

    const store = configureStore({
        "reducer": usecasesToReducer(usecasesArr) as any,
        "middleware": getDefaultMiddleware =>
            getDefaultMiddleware({
                "thunk": { "extraArgument": thunksExtraArgument },
                "serializableCheck": false
            }).concat(middlewareEvtAction)
    });

    const { getState, dispatch } = store;

    //@ts-expect-error
    return { getState, dispatch, evtAction };
}
