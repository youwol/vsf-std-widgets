import { Modules } from '@youwol/vsf-core'
import { setup } from '../auto-generated'
import { module as autoFormModule } from './auto-form.module'
import { basePathDoc, urlModuleDoc } from './constants'

export function toolbox() {
    return {
        name: 'std-widgets',
        uid: setup.name,
        origin: {
            packageName: setup.name,
            version: setup.version,
        },
        documentation: `${basePathDoc}.html`,
        icon: {
            svgString: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
<path fill="teal" d="M496 384H160v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h80v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h336c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160h-80v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h336v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h80c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160H288V48c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16C7.2 64 0 71.2 0 80v32c0 8.8 7.2 16 16 16h208v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h208c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16z"/>
</svg>`,
        },
        modules: [
            new Modules.Module({
                declaration: {
                    typeId: 'autoForm',
                    documentation: urlModuleDoc(setup.name, 'AutoForm'),
                },
                implementation: ({ fwdParams }) => {
                    return autoFormModule(fwdParams)
                },
            }),
        ],
    }
}
