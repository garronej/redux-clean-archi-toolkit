import { createPort2 } from "./adapters/createProt2";
import type { Port2Config } from "./adapters/createProt2";
import { createPort1 } from "./adapters/createPort1";
import type { Port1Config } from "./adapters/createPort1";
import { createCore } from "redux-clean-architecture";
import { type GenericCore } from "redux-clean-architecture/createCore";
import { usecases } from "./usecases";
import type { ReturnType } from "tsafe";

type ParamsOfBootstrapCore = {
    port1Config: Port1Config;
    port2Config: Port2Config;
};

export async function bootstrapCore(params: ParamsOfBootstrapCore): Promise<{
    core: GenericCore<
        (typeof usecases)["usecase1"] | (typeof usecases)["usecase2"] | (typeof usecases)["usecase3"],
        {
            paramsOfBootstrapCore: ParamsOfBootstrapCore;
            port1: ReturnType<typeof createPort1>;
            port2: ReturnType<typeof createPort2>;
        }
    >;
    context: {
        port1: ReturnType<typeof createPort1>;
    };
}> {
    const [port1, port2] = await Promise.all([
        createPort1(params.port1Config),
        createPort2(params.port2Config)
    ]);

    const x = createCore({
        /*
        "context": {
            "paramsOfBootstrapCore": params,
            port1,
            port2
        },
        */
        "thunksExtraArgument": {
            "paramsOfBootstrapCore": params,
            port1,
            port2
        },
        usecases
    });

    await x.dispatch(usecases.usecase2.privateThunks.initialize());

    const core = x.core;

    return { core, "context": { port1 } };
}

export type State = createCore.Infer<"State", typeof bootstrapCore>;
export type Thunks = createCore.Infer<"Thunks", typeof bootstrapCore>;
export type CreateEvt = createCore.Infer<"CreateEvt", typeof bootstrapCore>;