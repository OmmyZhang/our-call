const CTEXT = "5634944c8a88556f84e824bf36fcf12a";
const coder = new TextEncoder();

export function gen_app_id(s: string): string {
  const ctext = CTEXT.split("");

  const parray = coder.encode(s);

  return Array.from({ length: 32 }, (_, i) => {
    const p = parray[i] ? parray[i] % ctext.length : 0;
    const x = ctext[p];
    ctext.splice(p, 1);
    return x;
  }).join("");
}
