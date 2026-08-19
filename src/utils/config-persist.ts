import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function persistNumberArray(filePath:string, exports:Record<string, number[]>){
    const lines = Object.entries(exports).map(([name, values]) =>
        `export const ${name}:number[] = [\n${values.map(v => `    ${v},`).join('\n')}\n]`
    );
    writeFileSync(filePath, lines.join('\n\n') + '\n', 'utf8');
}

export function persistStringMap(filePath:string, exports:Record<string, Record<string, string>>){
    const lines = Object.entries(exports).map(([name, map]) => {
        const entries = Object.entries(map).map(([key, value]) => `    '${key}': '${value}',`).join('\n');
        return `export const ${name}:Record<string, string> = {\n${entries}\n}`;
    });
    writeFileSync(filePath, lines.join('\n\n') + '\n', 'utf8');
}

export function configPath(relative:string):string{
    return fileURLToPath(new URL(relative, import.meta.url));
}