import { Configurations, Immutable, Modules } from '@youwol/vsf-core'
import { map } from 'rxjs/operators'
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs'
import { children$ } from '@youwol/flux-view'

export const configuration = {
    schema: {
        schema: {},
    },
}

export const inputs = {
    input$: {},
}

export const outputs = (
    arg: Modules.OutputMapperArg<
        typeof configuration.schema,
        typeof inputs,
        State
    >,
) => ({
    outputs$: arg.state.updated$.pipe(map((d) => ({ data: d, context: {} }))),
})

/**
 * Manage IO observables required by the module's implementation.
 *
 * @category State
 */
export class State {
    /**
     * Emit the schema that needs to be represented by the form:
     * *  at construction time (through the static configuration)
     * *  whenever an incoming message updating the schema is entering the module's input
     *
     * @group Observables
     */
    public readonly schema$: Observable<
        Immutable<Partial<Configurations.Schema>>
    >
    private readonly _schema$: BehaviorSubject<
        Immutable<Partial<Configurations.Schema>>
    >
    /**
     * Emit the updated configuration at any change from the form.
     * @group Observables
     */
    public readonly updated$: Observable<Immutable<unknown>>
    private readonly _updated$: Subject<Immutable<unknown>> = new Subject()

    constructor(fwdParameters) {
        this._schema$ = new BehaviorSubject<Partial<Configurations.Schema>>(
            fwdParameters.configurationInstance.schema,
        )
        this.schema$ = this._schema$.asObservable()
        this.updated$ = this._updated$.asObservable()
    }
    emit(value) {
        this._updated$.next(value)
    }
}

export function module(fwdParameters: Modules.ForwardArgs) {
    const state = new State(fwdParameters)
    return new Modules.Implementation<
        typeof configuration.schema,
        typeof inputs,
        State
    >(
        {
            configuration,
            inputs,
            outputs,
            html: () => html(state),
            state,
        },
        fwdParameters,
    )
}

type AttributeTrait<T> = Configurations.AttributeTrait<T, Modules.OverrideType>

function html(state: State) {
    return {
        class: 'fv-bg-background container py-1 border rounded',
        children: children$(state.schema$, (schema) => {
            const children = Object.entries(schema)
                .map(([k, v]) => {
                    const asAttribute = v as AttributeTrait<unknown>
                    return [
                        k,
                        v,
                        factory.find((elem) => elem.test(asAttribute)),
                    ]
                })
                .filter(([, , elem]) => elem != undefined)
                .map(
                    ([key, attr, elem]: [
                        string,
                        AttributeTrait<unknown>,
                        { view },
                    ]) => {
                        const value$ = new BehaviorSubject(attr.getValue())
                        const targetView = elem.view(attr, value$)
                        return {
                            key,
                            value$,
                            class: 'd-flex align-items-center row px-2',
                            children: [
                                { class: 'col', innerText: key },
                                { class: 'col', ...targetView },
                            ],
                        }
                    },
                )
            combineLatest(children.map((c) => c.value$))
                .pipe(
                    map((values) => {
                        return values.reduce(
                            (acc: { [k: string]: unknown }, e, i) => ({
                                ...acc,
                                [children[i].key]: e,
                            }),
                            {},
                        )
                    }),
                )
                .subscribe((d) => {
                    state.emit(d)
                })
            return children
        }),
    }
}

const factory = [
    {
        test: (att) => att instanceof Configurations.String,
        view: (
            att: AttributeTrait<string>,
            value$: BehaviorSubject<string>,
        ) => {
            return {
                tag: 'input',
                type: 'text',
                value: att.getValue(),
                onchange: (ev) => value$.next(ev.target.value),
            }
        },
    },
    {
        test: (att) => att instanceof Configurations.Boolean,
        view: (
            att: AttributeTrait<boolean>,
            value$: BehaviorSubject<boolean>,
        ) => {
            return {
                tag: 'input',
                type: 'checkbox',
                value: att.getValue(),
                onchange: (ev) => value$.next(ev.target.checked),
            }
        },
    },
    {
        test: (att) =>
            att instanceof Configurations.Float ||
            att instanceof Configurations.Integer,
        view: (
            att: AttributeTrait<number>,
            value$: BehaviorSubject<number>,
        ) => {
            return {
                tag: 'input',
                type: 'number',
                value: att.getValue(),
                onchange: (ev) => value$.next(parseFloat(ev.target.value)),
            }
        },
    },
]
