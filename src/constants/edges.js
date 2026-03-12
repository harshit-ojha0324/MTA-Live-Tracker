// Each entry: [stationA, stationB, travelMinutes, realStopCount]
// realStopCount = number of actual subway stops traversed (including destination, excluding origin)
export const EDGES = [
  // ── Midtown Manhattan ─────────────────────────────────────────────
  ["ts","gc",3,1],    // S shuttle / 7: Times Sq → Grand Central
  ["ts","hz",2,1],    // N/Q/R/W: Times Sq → Herald Sq (34 St)
  ["ts","ps",3,1],    // 1/2/3: Times Sq → Penn Station (34 St)
  ["ts","50_1",3,1],  // 1: Times Sq → 50 St
  ["ts","cp",5,2],    // 1: Times Sq → 50 St → Columbus Circle (59 St)
  ["gc","jk",15,8],   // 7: Grand Central → Jackson Hts (8 stops east into Queens)
  ["jk","gc",15,8],
  ["gc","lex59",5,2], // 4/5/6: Grand Central → 51 St → Lexington Av–59 St
  ["gc","51_456",2,1],// 6: Grand Central → 51 St
  ["gc","33_6",3,1],  // 6: Grand Central → 33 St
  ["ps","hz",2,1],    // N/Q/R/W + B/D/F/M: Penn Station → Herald Sq
  ["ps","23_1",3,1],  // 1: Penn Station → 23 St
  ["ps","ch",6,3],    // 1/A/C: Penn Station → 18 St → Chambers St (skipping stops)
  ["ps","14a",5,1],   // A/C/E: Penn Station → 14 St–8 Av
  ["ps","jk",20,9],   // E: Penn Station → Jackson Hts (9 stops via Queens Blvd)
  ["jk","ps",20,9],
  ["hz","28_1",2,1],  // 1: Herald Sq → 28 St
  ["hz","un",4,3],    // N/Q/R/W: Herald Sq → 28 St → 23 St → Union Sq (14 St)
  ["hz","cn",5,4],    // N/Q/R/W: Herald Sq → 28 St → 23 St → 14 St → Canal St
  ["hz","jk",20,8],   // F/M/R: Herald Sq → Jackson Hts (8 stops via Queens Blvd)
  ["jk","hz",20,8],
  ["hz","dek",12,5],  // B/D: Herald Sq → Grand St → Broadway-Laf → DeKalb (5 stops)
  ["dek","hz",12,5],

  // ── Downtown Manhattan ────────────────────────────────────────────
  ["fc","bh",2,1],    // 2/3/4/5 + A/C + J/Z: Fulton St → Brooklyn Bridge
  ["fc","ws",2,1],    // 2/3/4/5: Fulton St → Wall St
  ["fc","ch",3,1],    // 2/3 + A/C: Fulton St → Chambers St
  ["bwy","fc",20,10], // J/Z: Broadway Jct → Fulton St (10 stops to Manhattan)
  ["fc","bwy",20,10],
  ["wt","ch",2,1],    // A/C/E + 1: World Trade Center → Chambers St
  ["wt","fc",3,1],    // A/C/E: World Trade Center → Fulton St
  ["wt","cn",4,1],    // A/C/E: World Trade Center → Canal St
  ["bh","cn",3,1],    // 4/5/6 + J/Z: Brooklyn Bridge → Canal St
  ["bh","fc",2,1],    // 2/3/4/5 + A/C + J/Z: Brooklyn Bridge → Fulton St

  // ── Upper West Side / 1 train ─────────────────────────────────────
  ["cp","66",2,1],     // 1: Columbus Circle → 66 St
  ["cp","lex59",5,2],  // N/Q/R/W: Columbus Circle → 57 St → Lexington Av–59 St
  ["cp","72_123",3,1], // B/C: Columbus Circle → 72 St
  ["cp","ts",5,2],     // 1: Columbus Circle → 50 St → Times Sq
  ["lex59","68",2,1],  // 4/5/6: Lexington Av–59 St → 68 St–Hunter
  ["lex59","51_456",3,1], // 4/5/6: Lexington Av–59 St → 51 St
  ["50_1","ts",3,1],
  ["50_1","66",4,1],   // 1: 50 St → 66 St
  ["66","cp",2,1],
  ["66","72_123",2,1],
  ["72_123","66",2,1],
  ["72_123","96_123",5,2], // 1/2/3: 72 St → 86 St → 96 St
  ["96_123","72_123",5,2],
  ["96_123","116",4,1],
  ["116","96_123",4,1],
  ["116","125_123",3,1],
  ["125_123","116",3,1],

  // ── Upper East Side / Harlem ──────────────────────────────────────
  ["har","86_456",8,4],   // 4/5/6: Harlem–125 St → 4 stops → 86 St
  ["har","125_a",4,1],    // transfer: Harlem–125 St ↔ 125 St (A/B/C/D)
  ["86_456","har",8,4],
  ["86_456","68",5,2],    // 4/5/6: 86 St → 77 St → 68 St–Hunter
  ["68","lex59",2,1],
  ["68","86_456",5,2],
  ["51_456","gc",2,1],
  ["51_456","lex59",3,1],
  ["33_6","gc",3,1],
  ["33_6","28_6",2,1],
  ["28_6","33_6",2,1],
  ["28_6","23_6",2,1],
  ["23_6","28_6",2,1],
  ["23_6","un",2,1],

  // ── Lower Manhattan / Village ─────────────────────────────────────
  ["ch","cn",2,1],
  ["ch","fc",3,1],
  ["ch","wt",2,1],
  ["ws","fc",2,1],
  ["ws","bg",5,2],    // 2/3/4/5: Wall St → Fulton → Borough Hall
  ["un","23_6",2,1],
  ["un","as",2,1],
  ["un","14a",3,1],
  ["un","bl",3,2],    // 4/5/6: Union Sq → Astor Pl → Bleecker
  ["cn","bl",2,1],
  ["cn","wp",3,1],
  ["cn","spr",2,1],
  ["bl","as",2,1],
  ["bl","wp",2,1],
  ["bl","spr",2,2],
  ["wp","14a",3,1],
  ["wp","bl",2,1],
  ["wp","cn",3,1],
  ["as","un",2,1],
  ["as","bl",2,1],
  ["14a","wp",3,1],
  ["14a","6av_l",1,1],
  ["14a","23_1",3,2],  // 1: 14 St → 18 St → 23 St
  ["23_1","28_1",2,1],
  ["23_1","14a",3,2],
  ["28_1","hz",2,1],
  ["28_1","23_1",2,1],
  ["spr","cn",2,1],
  ["spr","bl",2,1],

  // ── Upper Manhattan / A line ──────────────────────────────────────
  ["inv","175",6,2],
  ["175","inv",6,2],
  ["175","145_a",5,2],
  ["145_a","175",5,2],
  ["145_a","125_a",4,2],
  ["125_a","145_a",4,2],
  ["125_a","cp",10,8],   // A/B/C/D: 125 St → 8 stops → Columbus Circle (59 St)
  ["125_a","har",4,1],
  ["125_123","125_a",4,1],

  // ── Queens ────────────────────────────────────────────────────────
  ["jk","fl",10,7],   // 7: Jackson Hts → 7 stops → Flushing–Main St
  ["fl","jk",10,7],

  // ── Brooklyn – Atlantic Av hub ────────────────────────────────────
  ["at","dek",2,1],   // B/D/N/Q/R: Atlantic Av → DeKalb Av
  ["at","bg",2,1],    // 2/3/4/5: Atlantic Av → Borough Hall
  ["at","pk",3,2],    // 2/3: Atlantic Av → Nevins → Park Pl area
  ["br","at",18,9],   // R: Bay Ridge–95 St → 9 stops → Atlantic Av–Barclays Ctr
  ["at","br",18,9],
  ["at","ci",25,12],  // D/N/Q: Atlantic Av → 12 stops → Coney Island–Stillwell
  ["ci","at",25,12],
  ["dek","at",2,1],
  ["dek","jay",3,1],  // R/B/D/N/Q: DeKalb Av → Jay St–MetroTech
  ["jay","dek",3,1],
  ["jay","hoy",2,1],  // A/C/G: Jay St → Hoyt–Schermerhorn
  ["jay","hp",3,1],   // A/C: Jay St → High St–Brooklyn Bridge
  ["jay","ci",30,14], // F: Jay St → 14 stops → Coney Island–Stillwell
  ["ci","jay",30,14],
  ["bg","at",2,1],
  ["bg","ws",5,2],    // 2/3/4/5: Borough Hall → Fulton → Wall St
  ["bg","hp",3,1],    // nearby: Borough Hall ↔ High St (A/C transfer)
  ["hp","bg",3,1],
  ["hp","jay",3,1],
  ["hp","ch",5,1],    // A/C: High St → Chambers St
  ["at","ber",3,1],   // F/G: Atlantic Av → Bergen St
  ["ber","car",2,1],
  ["ber","ful_g",1,1],
  ["car","ber",2,1],
  ["ful_g","ber",1,1],
  ["ful_g","cla",2,1],
  ["cla","ful_g",2,1],
  ["hoy","jay",2,1],
  ["hoy","cla",4,2],  // G: Hoyt → Fulton (G) → Classon
  ["hoy","nst",5,1],  // A/C: Hoyt–Schermerhorn → Nostrand Av
  ["nst","hoy",5,1],

  // ── Brooklyn – G train north ──────────────────────────────────────
  ["lor","cla",10,6], // G: Lorimer/Metropolitan Av → 6 stops → Classon Av
  ["cla","lor",10,6],
  ["lor","gpt",3,1],
  ["lor","nas",2,1],
  ["gpt","lor",3,1],
  ["gpt","nas",2,1],
  ["nas","gpt",2,1],

  // ── Brooklyn – L train ────────────────────────────────────────────
  ["lor","bed",2,1],
  ["bed","lor",2,1],
  ["bed","1av",5,1],  // L: Bedford Av → 1 Av (crosses East River)
  ["1av","bed",5,1],
  ["1av","3av",2,1],
  ["3av","1av",2,1],
  ["3av","6av_l",3,1],
  ["6av_l","3av",3,1],
  ["6av_l","14a",1,1],

  // ── Brooklyn – Broadway Jct / A/C/J/Z/L ──────────────────────────
  ["bwy","lor",6,6],  // L: Broadway Jct → 6 stops → Lorimer St
  ["lor","bwy",6,6],
  ["bwy","nst",5,2],  // A/C: Broadway Jct → Franklin Av → Nostrand Av
  ["nst","bwy",5,2],
  ["bwy","rh",35,10], // A: Broadway Jct → 10 stops → Rockaway Park
  ["rh","bwy",35,10],

  // ── Brooklyn – Eastern / 2/3 ──────────────────────────────────────
  ["pk","at",3,2],
  ["pk","ept",2,1],
  ["ept","pk",2,1],
];
