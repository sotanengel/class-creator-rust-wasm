/* tslint:disable */
/* eslint-disable */
/**
 * @param {string} csv_data
 * @param {boolean} include_impl
 * @returns {string}
 */
export function generate_struct_from_csv(csv_data: string, include_impl: boolean): string;
/**
 * @param {string} csv_data
 * @param {boolean} include_impl
 * @param {Position} struct_name_position
 * @param {Position} struct_detail_position
 * @param {Position} logical_name_position
 * @param {Position} physical_name_position
 * @param {Position} type_position
 * @param {Position} detail_position
 * @returns {string}
 */
export function generate_struct_from_custom_csv(csv_data: string, include_impl: boolean, struct_name_position: Position, struct_detail_position: Position, logical_name_position: Position, physical_name_position: Position, type_position: Position, detail_position: Position): string;
export class Position {
  free(): void;
  /**
   * @param {number} row
   * @param {number} column
   */
  constructor(row: number, column: number);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_position_free: (a: number, b: number) => void;
  readonly position_new: (a: number, b: number) => number;
  readonly generate_struct_from_csv: (a: number, b: number, c: number, d: number) => void;
  readonly generate_struct_from_custom_csv: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
