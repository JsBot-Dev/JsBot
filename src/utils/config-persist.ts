import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function persistNumberArray(filePath:string, exports:Record<string, number[]>){
    const lines = Object.entries(exports).map(([name, values]) =>
        `export const ${name}:number[] = [\n${values.map(v => `    ${v},`).join('\n')}\n]`
    );
    writeFileSync(filePath, lines.join('\n\n') + '\n', 'utf8');
}

export function configPath(relative:string):string{
    return fileURLToPath(new URL(relative, import.meta.url));
}