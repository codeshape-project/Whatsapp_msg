export function normalizePhone(value){
  const raw=String(value??'').trim();
  let digits=raw.replace(/[^\d]/g,'');
  if(raw.startsWith('00')) digits=digits.slice(2);
  if(digits.length===10) digits=`91${digits}`; // default for this project; provide country code for other countries
  if(digits.length<8 || digits.length>15) return null;
  return digits;
}
