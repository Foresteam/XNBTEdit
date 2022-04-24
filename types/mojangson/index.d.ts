declare module "mojangson" {
	 function simplify(data: object): object;
	 function stringify({ value, type }: { value: object, type: string }): string;
	 function parse(text: string): object;
	 function normalize(str: string): string;
}