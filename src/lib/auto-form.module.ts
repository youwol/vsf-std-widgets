import { Configurations, Immutable, Modules } from '@youwol/vsf-core'
import { map } from 'rxjs/operators'
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs'
import { AnyVirtualDOM } from '@youwol/rx-vdom'

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

    constructor(fwdParameters: Modules.ForwardArgs) {
        this._schema$ = new BehaviorSubject(
            fwdParameters.configurationInstance[
                'schema'
            ] as Partial<Configurations.Schema>,
        )
        this.schema$ = this._schema$.asObservable()
        this.updated$ = this._updated$.asObservable()
    }
    emit(value: unknown) {
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

function html(state: State): AnyVirtualDOM {
    return {
        tag: 'div' as const,
        class: 'fv-bg-background container py-1 border rounded',
        children: {
            policy: 'replace',
            source$: state.schema$,
            vdomMap: (schema: Immutable<Partial<Configurations.Schema>>) => {
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
                                tag: 'div' as const,
                                key,
                                value$,
                                class: 'd-flex align-items-center row px-2',
                                children: [
                                    {
                                        tag: 'div' as const,
                                        class: 'col',
                                        innerText: key,
                                    },
                                    {
                                        class: 'col',
                                        ...targetView,
                                    },
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
            },
        },
    }
}

const factory = [
    {
        test: (att: unknown) => att instanceof Configurations.String,
        view: (
            att: AttributeTrait<string>,
            value$: BehaviorSubject<string>,
        ) => {
            return {
                tag: 'input' as const,
                type: 'text',
                value: att.getValue(),
                onchange: (ev: KeyboardEvent) =>
                    value$.next(ev.target['value']),
            }
        },
    },
    {
        test: (att: unknown) => att instanceof Configurations.Boolean,
        view: (
            att: AttributeTrait<boolean>,
            value$: BehaviorSubject<boolean>,
        ) => {
            return {
                tag: 'input' as const,
                type: 'checkbox',
                value: att.getValue(),
                onchange: (ev: MouseEvent) => value$.next(ev.target['checked']),
            }
        },
    },
    {
        test: (att: unknown) =>
            att instanceof Configurations.Float ||
            att instanceof Configurations.Integer,
        view: (
            att: AttributeTrait<number>,
            value$: BehaviorSubject<number>,
        ) => {
            return {
                tag: 'input' as const,
                type: 'number',
                value: att.getValue(),
                onchange: (ev: KeyboardEvent) =>
                    value$.next(parseFloat(ev.target['value'])),
            }
        },
    },
]
