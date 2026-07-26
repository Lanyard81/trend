import { useState, useEffect, useMemo, useRef } from "react";
import { Preferences } from "@capacitor/preferences";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from "recharts";

// ---------- constants ----------
const HEIGHT_M = 1.78;
const PINE = "var(--pine)";
const PINE_T = "var(--pine-t)";
const TEAL = "var(--teal)";
const MIST = "var(--bg)";
const INK = "var(--ink)";
const AMBER = "var(--amber)";
const GOOD = "var(--good)";
const NEUTRAL_VARS = {
  light: { "--bg": "#F6F1E7", "--surface": "#FFFDF8", "--surface2": "#FBF7EE", "--ink": "#2B2620", "--amber": "#A97328", "--good": "#4C8767", "--mut": "#6B6055", "--faint": "#A69C8C", "--line": "#E8E0D2", "--line2": "#E2D9C8", "--bord": "#E8E0D2", "--warn-bg": "#FBF0DE", "--warn-t": "#8A5A16", "--gold": "#8A6D3B" },
  dark: { "--bg": "#000000", "--surface": "#171310", "--surface2": "#1E1811", "--ink": "#F3EDE3", "--amber": "#E0AA4E", "--good": "#5FA97E", "--mut": "#C9BEAE", "--faint": "#7A6F60", "--line": "#2A241C", "--line2": "#322A20", "--bord": "#332B21", "--warn-bg": "#241B08", "--warn-t": "#E5B876", "--gold": "#C7A15F" },
};
const COLOR_THEMES = [
  { id: "forest", name: "Forest & Mustard", primary: "#2F4A3E", ptD: "#6FA98A", accL: "#C9922B", accD: "#E0AA4E", onAL: "#2B2011", onAD: "#241A08" },
  { id: "navy", name: "Navy & Terracotta", primary: "#22364F", ptD: "#6E8FB8", accL: "#C1652F", accD: "#E08856", onAL: "#FFFFFF", onAD: "#241205" },
  { id: "plum", name: "Plum & Copper", primary: "#4B3050", ptD: "#A987AE", accL: "#B67A4B", accD: "#D69A6C", onAL: "#FFFFFF", onAD: "#291708" },
];
function themeVars(ctId, dark) {
  const pal = COLOR_THEMES.find((t) => t.id === ctId) || COLOR_THEMES[0];
  return {
    ...NEUTRAL_VARS[dark ? "dark" : "light"],
    "--pine": pal.primary,
    "--pine-t": dark ? pal.ptD : pal.primary,
    "--teal": dark ? pal.accD : pal.accL,
    "--teal-soft": dark ? pal.accD + "29" : pal.accL + "1F",
    "--on-accent": dark ? pal.onAD : pal.onAL,
  };
}

const DEFAULT_HABITS = [
  "Morning dog walk",
  "Gym / Swim / Pilates done",
  "Ate batch meals (no takeaway)",
  "Benefibre ×2",
  "Supplements taken",
  "Kitchen closed by 8pm",
  "PlayStation ≤ 90 min",
];

const DEFAULT_RECIPES = [
  { id: "b1", type: "breakfast", name: "Egg & chicken breakfast muffins", cal: 375, p: 40, c: 24, f: 13, serves: "12 muffins · 2 per serve + toast", ingredients: "10 eggs\n600ml egg whites (carton)\n350g cooked chicken breast, shredded\n2 handfuls baby spinach, chopped\n1 red capsicum, diced\n12 cherry tomatoes, halved\n60g feta\nSalt, pepper, oregano\nWholegrain toast to serve (1 slice each)", method: "Oven 180°C. Grease a 12-hole muffin tin well.\nWhisk eggs and egg whites with seasoning.\nDivide chicken, veg and feta between holes, pour egg over.\nBake 20–24 min until puffed and set. Cool fully, refrigerate.\nServe 2 muffins + 1 slice wholegrain toast. Reheat muffins 40 sec." },
  { id: "b2", type: "breakfast", name: "Turkey patties + roast tomato", cal: 368, p: 44, c: 30, f: 8, serves: "12 patties · 2 per serve + toast", ingredients: "1kg turkey BREAST mince (not regular)\n1 zucchini, grated & squeezed\n1 small onion, grated\n2 eggs\n½ cup rolled oats\n1 tsp sage or mixed herbs\n9 roma tomatoes, halved\nWholegrain toast to serve", method: "Oven 200°C. Mix everything except tomatoes, shape 12 patties.\nPatties on one tray, tomatoes (cut-side up, salted) on another.\nBake 20–25 min until patties reach 74°C.\nServe 2 patties + 3 tomato halves + 1 slice toast. Reheat 60–90 sec." },
  { id: "b3", type: "breakfast", name: "Protein overnight oats", cal: 377, p: 36, c: 47, f: 5, serves: "Per jar — make 6", ingredients: "½ cup rolled oats\n1 scoop (30g) vanilla whey protein\n200ml skim milk\n1 tsp chia seeds\n½ tsp cinnamon\n½ grated apple or ⅓ cup frozen berries\n1 tsp honey", method: "Stir oats, protein powder and cinnamon together first (stops clumping).\nAdd milk, chia, fruit and honey; stir well.\nSeal and refrigerate overnight. Stir before eating. Keeps 3 days." },
  { id: "b4", type: "breakfast", name: "Breakfast burrito", cal: 443, p: 39, c: 38, f: 15, serves: "6 serves", ingredients: "10 eggs\n400ml egg whites\n200g cooked chicken breast, diced\n1 tin black beans, rinsed\n1 red capsicum, diced\n½ red onion, diced\n60g grated tasty cheese\nJuice of 1 lime\n6 wholegrain wraps", method: "Soften onion and capsicum 4 min.\nAdd beans and chicken, warm through. Scramble whisked eggs + whites in gently until just set.\nOff heat, fold through cheese and lime.\nReheat a portion 60 sec, serve in a wholegrain wrap." },
  { id: "b5", type: "breakfast", name: "Banana-oat protein slice", cal: 362, p: 37, c: 40, f: 6, serves: "6 squares + glass of milk", ingredients: "3 ripe bananas, mashed\n3 eggs\n500ml egg whites\n2 scoops (60g) vanilla whey protein\n2½ cups rolled oats\n250g low-fat cottage cheese\n2 tsp cinnamon, 1 tsp baking powder\n¼ cup chopped walnuts\n1 tbsp honey\nGlass of skim milk to serve (300ml)", method: "Oven 180°C, line a 20×30cm tray.\nBlend or whisk wet ingredients + cottage cheese, stir in dry.\nBake 35–40 min until golden and set. Cool, slice into 6, refrigerate.\nServe a square with a big glass of milk. Eat cold or warmed 30 sec." },
  { id: "d1", type: "dinner", name: "Lemon chicken tray bake", cal: 605, p: 67, c: 55, f: 13, serves: "6 serves", ingredients: "1.3kg chicken BREAST, large chunks\n1.5kg baby potatoes, halved\n3 carrots, chunks\n2 capsicums, chunks\n2 red onions, wedges\n2 tbsp olive oil\n1 lemon (juice + zest)\n2 tsp oregano, 3 garlic cloves", method: "Oven 200°C. Roast potatoes and carrots with half the oil, 20 min head start.\nToss chicken, capsicum, onion with remaining oil, lemon, garlic, oregano; add to trays.\nRoast 20–22 min more — breast dries out past 74°C, so don't overshoot.\nReheat serves 2 min, covered, with a splash of water." },
  { id: "d2", type: "dinner", name: "Beef & lentil bolognese", cal: 631, p: 63, c: 70, f: 11, serves: "6 serves", ingredients: "1.25kg extra-lean beef mince (5-star)\n1 cup dried red lentils\n1 onion, 2 carrots, 2 celery sticks, diced\n3 garlic cloves\n2 tins crushed tomatoes\n1 tbsp tomato paste\n2 cups beef stock\nBasil, oregano\n¾ cup cooked rice or pasta per serve", method: "Brown mince in batches. Add veg, cook 5 min. Garlic + paste, 1 min.\nAdd lentils, tomatoes, stock, herbs.\nSimmer 30–35 min until lentils soft, adding water if thick. Season.\nServe over ¾ cup cooked rice or pasta." },
  { id: "d3", type: "dinner", name: "Lamb & lentil curry (mild)", cal: 644, p: 56, c: 60, f: 20, serves: "6 serves — the richest dinner; pair with a low-fat breakfast day", ingredients: "1.1kg lean lamb leg, trimmed, diced\n¾ cup dried red lentils\n400g sweet potato, chunks\n1 onion, 3 garlic cloves, 1 tbsp ginger\n3 tbsp mild korma paste\n1 tin LIGHT coconut milk\n1½ cups stock\n3 handfuls baby spinach\n½ cup cooked rice per serve", method: "Brown lamb in batches. Soften onion, add garlic, ginger, korma paste 1 min.\nReturn lamb + coconut milk + stock. Simmer covered 40 min.\nAdd lentils and sweet potato, 20–25 min more until tender.\nWilt spinach through. Serve over ½ cup rice. Better on day 2." },
  { id: "d4", type: "dinner", name: "Honey-ginger turkey rice bowls", cal: 533, p: 65, c: 57, f: 5, serves: "6 serves", ingredients: "1.4kg turkey BREAST mince\n2 tbsp ginger, 4 garlic cloves\n⅓ cup low-salt soy\n2 tbsp honey, 2 tsp sesame oil\n2 heads broccoli\n3 carrots\n2¼ cups uncooked rice\nSesame seeds, spring onion", method: "Cook rice. Steam broccoli and carrot just tender.\nBrown turkey in sesame oil; ginger + garlic last minute.\nStir in soy and honey, simmer 2 min until glossy.\nAssemble 6 containers: 1 cup rice, veg, turkey, sesame on top." },
  { id: "d5", type: "dinner", name: "Beef, bean & vegetable casserole", cal: 520, p: 52, c: 42, f: 16, serves: "6 serves", ingredients: "1.4kg chuck/gravy beef, WELL trimmed, 4cm chunks\n1 tin cannellini beans, rinsed\n2 tbsp flour, 1 tbsp oil\n1 onion, 3 garlic cloves\n3 carrots, 3 celery sticks, chunks\n800g potatoes, chunks\n2 tbsp tomato paste\n2 cups beef stock\n1 cup frozen peas\nBay leaves, thyme", method: "Oven 160°C. Flour and brown beef in an ovenproof pot.\nSoften onion; garlic + paste 1 min. Return beef with stock and herbs.\nCover, bake 1 hour. Add carrot, celery, potato; bake 45–60 min more.\nStir beans and peas through for the last 10 min. Reheats brilliantly." },
  { id: "b6", type: "breakfast", name: "Cottage cheese protein pancakes", cal: 380, p: 38, c: 40, f: 8, serves: "12 pancakes · 2 per serve", ingredients: "500g low-fat cottage cheese\n6 eggs\n300ml egg whites\n2 cups rolled oats\n2 scoops (60g) vanilla whey protein\n2 tsp baking powder\n1 tsp cinnamon\nBerries or sliced banana to serve", method: "Blend everything until smooth (batter thickens as it sits — 5 min rest).\nCook ¼-cup rounds in a non-stick pan over medium, 2–3 min per side.\nCool fully, stack with baking paper between, refrigerate.\nServe 2 pancakes with berries or ½ banana. Reheat 30–40 sec." },
  { id: "b7", type: "breakfast", name: "Protein French toast with berries", cal: 375, p: 38, c: 42, f: 9, serves: "6 serves · 2 slices each", ingredients: "12 slices wholegrain bread\n6 eggs\n500ml egg whites\n1 scoop (30g) vanilla whey protein\n200ml skim milk\n2 tsp cinnamon\n2 cups frozen mixed berries\n1 tbsp honey", method: "Whisk eggs, whites, whey, milk and cinnamon until smooth.\nSoak bread 20 sec per side, cook in a non-stick pan 2–3 min per side until golden.\nSimmer berries + honey 5 min into a compote.\nRefrigerate toast and compote separately. Reheat toast in the toaster (crispier than microwave), spoon compote over." },
  { id: "b8", type: "breakfast", name: "Chicken & corn frittata slices", cal: 360, p: 41, c: 20, f: 12, serves: "6 large slices", ingredients: "10 eggs\n500ml egg whites\n400g cooked chicken breast, shredded\n1 tin corn kernels, drained\n1 red capsicum, diced\n4 spring onions, sliced\n80g grated tasty cheese\nSalt, pepper", method: "Oven 180°C. Line a 20×30cm baking dish.\nWhisk eggs and whites with seasoning; stir in chicken, corn, capsicum, spring onion.\nPour into dish, scatter cheese over.\nBake 30–35 min until set and golden. Cool, cut into 6, refrigerate. Reheat 60–90 sec." },
  { id: "b9", type: "breakfast", name: "Ham, egg & cheese breakfast muffins", cal: 390, p: 37, c: 34, f: 12, serves: "6 sandwiches — freezer-friendly", ingredients: "6 wholegrain English muffins\n8 eggs\n300ml egg whites\n200g shaved lean leg ham (97% fat free)\n6 slices reduced-fat cheese\nBaby spinach\nPepper", method: "Oven 180°C. Whisk eggs + whites, pour into a lined 20×30cm dish, bake 15–18 min until just set. Cut into 6 squares.\nSplit and lightly toast muffins.\nAssemble: muffin, spinach, egg square, ham, cheese, lid.\nWrap individually. Fridge 3 days or freeze. Reheat wrapped in paper towel 60–90 sec." },
  { id: "b10", type: "breakfast", name: "Choc-banana protein overnight oats", cal: 385, p: 36, c: 48, f: 6, serves: "Per jar — make 6", ingredients: "½ cup rolled oats\n1 scoop (30g) chocolate whey protein\n1 tbsp cocoa powder\n200ml skim milk\n1 tsp chia seeds\n½ banana, sliced\n1 tsp honey", method: "Stir oats, whey and cocoa together first.\nAdd milk, chia and honey; stir well. Top with banana.\nSeal and refrigerate overnight. Keeps 3 days — add banana fresh if you prefer it firm." },
  { id: "b11", type: "breakfast", name: "Beef breakfast patties + tomato", cal: 365, p: 42, c: 28, f: 9, serves: "12 patties · 2 per serve + toast", ingredients: "1kg extra-lean beef mince (5-star)\n1 small onion, grated\n1 carrot, grated\n2 eggs\n½ cup rolled oats\n1 tsp smoked paprika (mild)\n9 roma tomatoes, halved\nWholegrain toast to serve", method: "Oven 200°C. Mix mince, onion, carrot, eggs, oats, paprika; shape 12 patties.\nBake patties and salted tomato halves 20–25 min.\nServe 2 patties + 3 tomato halves + 1 slice toast. Reheat 60–90 sec." },
  { id: "b12", type: "breakfast", name: "Chicken & egg breakfast quesadillas", cal: 400, p: 40, c: 36, f: 12, serves: "6 quesadillas", ingredients: "6 wholegrain wraps\n8 eggs\n300ml egg whites\n300g cooked chicken breast, shredded\n1 red capsicum, finely diced\n80g grated tasty cheese\n2 spring onions", method: "Scramble eggs + whites until just set; fold through chicken, capsicum, spring onion.\nSpread over half of each wrap, sprinkle cheese, fold over.\nToast each side 2 min in a dry pan until golden and sealed.\nCool, refrigerate. Reheat in a pan or sandwich press — stays crisp." },
  { id: "b13", type: "breakfast", name: "Apple-cinnamon baked protein oats", cal: 370, p: 36, c: 44, f: 6, serves: "6 squares + glass of milk", ingredients: "2½ cups rolled oats\n2 scoops (60g) vanilla whey protein\n3 eggs\n400ml egg whites\n2 apples, grated\n250g low-fat cottage cheese\n2 tsp cinnamon, 1 tsp baking powder\n1 tbsp honey\nSkim milk to serve", method: "Oven 180°C, line a 20×30cm tray.\nWhisk wet ingredients + cottage cheese, stir in dry + grated apple.\nBake 35–40 min until set. Cool, slice into 6.\nServe with a glass of milk. Eat cold or warmed." },
  { id: "b14", type: "breakfast", name: "Savoury breakfast fried rice", cal: 395, p: 38, c: 46, f: 8, serves: "6 serves", ingredients: "2 cups uncooked rice (cook and cool the night before)\n6 eggs\n400ml egg whites\n300g cooked chicken breast, diced\n1 cup frozen peas & corn\n3 spring onions\n2 tbsp low-salt soy\n1 tsp sesame oil", method: "Scramble eggs + whites in sesame oil; set aside.\nStir-fry cold rice with peas, corn and chicken until hot.\nReturn egg, add soy and spring onion, toss 1 min.\nPortion into 6 containers. Reheat 90 sec — a genuinely great savoury breakfast." },
  { id: "b15", type: "breakfast", name: "Make-ahead protein smoothie bags", cal: 350, p: 40, c: 42, f: 5, serves: "6 freezer bags — blend fresh each morning", ingredients: "Per bag: ½ banana + ½ cup frozen berries + 1 tbsp rolled oats\nAt blend time: 1 scoop (30g) whey protein + 250ml skim milk + 100g low-fat cottage cheese", method: "Prep 6 freezer bags with banana, berries and oats; freeze.\nEach morning: tip a bag into the blender with whey, milk and cottage cheese.\nBlend 45 sec. Done in under 2 minutes — the zero-effort option for rushed mornings." },
  { id: "d6", type: "dinner", name: "Chicken burrito bowls", cal: 590, p: 65, c: 64, f: 10, serves: "6 serves", ingredients: "1.3kg chicken breast, diced\n2 tsp smoked paprika, 1 tsp cumin, 1 tsp garlic powder (mild)\n2¼ cups uncooked rice\n1 tin black beans, rinsed\n1 tin corn, drained\n1 punnet cherry tomatoes, halved\n1 red onion, diced\n2 limes\n60g grated tasty cheese", method: "Cook rice. Toss chicken in spices, pan-fry in batches until cooked.\nAssemble 6 containers: rice, beans, corn, chicken, tomato, onion, cheese, lime squeeze.\nReheat 2 min. Optional: fresh coriander on serving day." },
  { id: "d7", type: "dinner", name: "Beef & broccoli stir-fry with rice", cal: 570, p: 60, c: 58, f: 12, serves: "6 serves", ingredients: "1.2kg lean rump or flank steak, thinly sliced\n3 heads broccoli, florets\n2 carrots, ribbons\n4 garlic cloves, 2 tbsp ginger\n⅓ cup low-salt soy + 2 tbsp oyster sauce\n1 tbsp cornflour + ½ cup water\n2 tsp sesame oil\n2¼ cups uncooked rice", method: "Cook rice. Steam broccoli and carrot 3 min — just underdone.\nSear beef in batches over high heat, 1–2 min; set aside.\nFry garlic and ginger 30 sec; add sauces + cornflour slurry, simmer until glossy.\nReturn beef and veg, toss to coat. Portion over rice." },
  { id: "d8", type: "dinner", name: "Turkey chilli con carne", cal: 585, p: 62, c: 62, f: 9, serves: "6 serves", ingredients: "1.4kg turkey breast mince\n1 onion, 1 red capsicum, diced\n4 garlic cloves\n2 tsp mild chilli powder, 2 tsp cumin, 1 tsp smoked paprika\n2 tins crushed tomatoes\n1 tin red kidney beans, rinsed\n1 cup chicken stock\n¾ cup cooked rice per serve", method: "Brown turkey in batches. Soften onion and capsicum; garlic + spices 1 min.\nAdd tomatoes, beans, stock. Simmer 25–30 min until thick.\nServe over rice. Mild as written — add chilli at the table if your partner wants heat.\nTastes better every day it sits." },
  { id: "d9", type: "dinner", name: "Honey-mustard chicken tray bake", cal: 560, p: 64, c: 50, f: 11, serves: "6 serves", ingredients: "1.3kg chicken breast\n3 tbsp wholegrain mustard + 2 tbsp honey + 1 tbsp olive oil\n1.2kg baby potatoes, halved\n500g green beans, trimmed\n2 red onions, wedges\n1 lemon", method: "Oven 200°C. Roast potatoes with half the oil 20 min head start.\nCoat chicken in mustard-honey mix; add to trays with onion.\nRoast 18–20 min; add green beans for the final 8 min.\nSqueeze lemon over. Portion into 6." },
  { id: "d10", type: "dinner", name: "Lamb & lentil shepherd's pie", cal: 575, p: 54, c: 50, f: 16, serves: "6 serves — one big dish", ingredients: "800g lean lamb mince\n¾ cup dried red lentils\n1 onion, 2 carrots, 2 celery sticks, diced\n3 garlic cloves\n2 tbsp tomato paste\n2 cups beef stock\n1 cup frozen peas\n1.2kg potatoes\n½ cup skim milk\nWorcestershire sauce, thyme", method: "Brown lamb; add veg 5 min, garlic + paste 1 min.\nAdd lentils, stock, a splash of Worcestershire, thyme. Simmer 25 min; stir peas through.\nBoil potatoes, mash with milk (no butter needed).\nTop filling with mash, rough the surface. Bake 200°C 25 min until golden. Portions reheat beautifully." },
  { id: "d11", type: "dinner", name: "Chicken souvlaki bowls with lemon rice", cal: 565, p: 66, c: 55, f: 10, serves: "6 serves", ingredients: "1.3kg chicken breast, chunks\nMarinade: 2 tbsp olive oil, juice of 2 lemons, 4 garlic cloves, 2 tsp dried oregano\n2¼ cups uncooked rice + zest of 1 lemon\n1 continental cucumber, diced\n1 punnet cherry tomatoes\n1 red onion, thin slices\n60g feta", method: "Marinate chicken 30 min (or overnight in the batch-cook rhythm).\nCook rice; stir lemon zest through.\nPan-fry or grill chicken in batches until charred at the edges.\nAssemble: rice, chicken, cucumber, tomato, onion, feta crumble. Keep salad separate if you like it crisp." },
  { id: "d12", type: "dinner", name: "Slow-baked beef ragu with pasta", cal: 600, p: 61, c: 62, f: 12, serves: "6 serves", ingredients: "1.4kg chuck beef, well trimmed, large chunks\n1 onion, 2 carrots, 2 celery sticks, diced\n4 garlic cloves\n2 tins crushed tomatoes\n2 tbsp tomato paste\n1 cup beef stock\nBay leaves, 1 tsp dried basil\n500g wholemeal pasta", method: "Oven 150°C. Brown beef in an ovenproof pot; set aside.\nSoften veg; garlic + paste 1 min. Return beef with tomatoes, stock, herbs.\nCover, bake 2½–3 hrs until it shreds with a fork (10 min hands-on, oven does the rest).\nShred through the sauce. Serve over pasta — ragu freezes brilliantly too." },
  { id: "d13", type: "dinner", name: "Chicken & vegetable pasta bake", cal: 595, p: 60, c: 63, f: 13, serves: "6 serves — one big dish", ingredients: "1.1kg chicken breast, diced\n400g wholemeal penne\n1 onion, 2 garlic cloves\n1 red capsicum, 1 zucchini, diced\n2 tins crushed tomatoes\n250g low-fat cottage cheese\n80g grated tasty cheese\nBasil, oregano", method: "Cook pasta 2 min under packet time. Brown chicken; soften veg + garlic.\nAdd tomatoes and herbs, simmer 10 min. Stir through pasta and cottage cheese (it melts into a creamy sauce).\nTip into a baking dish, top with tasty cheese. Bake 190°C 20 min until golden.\nCut into 6 — holds together even better on days 2–3." },
  { id: "d14", type: "dinner", name: "Mongolian-style lamb with rice", cal: 590, p: 57, c: 60, f: 15, serves: "6 serves", ingredients: "1.1kg lean lamb leg, thin slices\n1 tbsp cornflour\n4 garlic cloves, 2 tbsp ginger\n⅓ cup low-salt soy + 2 tbsp brown sugar + ½ cup water\n1 bunch spring onions, 5cm lengths\n2 heads broccoli, florets\n2¼ cups uncooked rice\n2 tsp sesame oil", method: "Cook rice; steam broccoli.\nToss lamb in cornflour. Sear in batches over high heat; set aside.\nFry garlic + ginger 30 sec; add soy, sugar, water — simmer 2 min until syrupy.\nReturn lamb with spring onion, toss 1 min. Portion over rice with broccoli." },
  { id: "d15", type: "dinner", name: "Chicken, leek & white bean bake", cal: 545, p: 63, c: 44, f: 12, serves: "6 serves", ingredients: "1.3kg chicken thigh fillets, trimmed well, halved\n2 leeks, sliced\n2 tins cannellini beans, rinsed\n4 garlic cloves\n1½ cups chicken stock\n1 tbsp wholegrain mustard\n1 tbsp olive oil\nThyme, lemon zest\nCrusty wholegrain roll per serve", method: "Oven 190°C. Brown chicken in the oil in an ovenproof pan; set aside.\nSoften leeks 5 min; garlic 1 min. Add beans, stock, mustard, thyme.\nNestle chicken on top. Bake uncovered 25–30 min.\nFinish with lemon zest. Serve with a crusty roll for the sauce." },
];
const MACRO_TARGETS = { p: 192, c: 191, f: 57 };
function calcMacros(profile, entries) {
  const ov = profile.macroOverride || {};
  const energy = calcEnergy(profile, entries);
  const sorted = [...entries].filter((e) => e.weight).sort((a, b) => a.date.localeCompare(b.date));
  const w = sorted.length ? sorted[sorted.length - 1].weight : parseFloat(profile.startWeight);
  if (!energy.target || !w) return { ...MACRO_TARGETS, auto: false, target: null };
  const p = ov.p > 0 ? ov.p : Math.round(w * 2.0);
  const f = ov.f > 0 ? ov.f : Math.round(energy.target * 0.27 / 9);
  const c = ov.c > 0 ? ov.c : Math.max(0, Math.round((energy.target - p * 4 - f * 9) / 4));
  return { p, c, f, auto: true, target: energy.target };
}
const PANTRY_RE = /\b(olive oil|sesame oil|oil spray|salt|pepper|oregano|basil|thyme|sage|mixed herbs|cinnamon|bay leav|honey|soy\b|soy sauce|flour|baking powder|chia|stock\b|chicken stock|beef stock|tomato paste|rolled oats|\brice\b(?! paper)|whey|paprika|cumin|garlic powder|chilli powder|worcestershire|cornflour|brown sugar|cocoa|sesame seeds|oyster sauce)/i;
const LUNCH_SNACKS_DEFAULT = { label: "Lunch + snacks (estimate — edit in Me)", p: 85, c: 90, f: 27 };

const DEFAULT_SUPPS = [
  { id: "s1", name: "Men's Essentials multivitamin", slot: "breakfast", note: "Take with food" },
  { id: "s2", name: "Vitamin D", slot: "breakfast", note: "Fat-soluble — take with a meal containing fat" },
  { id: "s3", name: "Zinc", slot: "dinner", note: "Keep ~10 hrs from the multivitamin — minerals compete for absorption" },
  { id: "s4", name: "Benefibre", slot: "morning", note: "Big glass of water · 1–2 hrs clear of supplements" },
  { id: "s5", name: "Benefibre", slot: "afternoon", note: "Second dose · same rules" },
];
const SLOT_LABELS = { breakfast: "with breakfast", morning: "mid-morning", lunch: "with lunch", afternoon: "mid-afternoon", dinner: "with dinner", custom: "custom time" };

const DEFAULT_WEEK = [
  { day: "Monday", focus: "Gym — Strength A", items: [
    { id: "m1", time: "06:30", text: "Wake" }, { id: "m2", time: "06:40", text: "Dog walk (35 min)" },
    { id: "m3", time: "07:20", text: "Breakfast", slot: "breakfast" }, { id: "m4", time: "08:15", text: "Leave for work (arrive 8:45)" },
    { id: "m5", time: "10:00", text: "Snack", slot: "morning" }, { id: "m6", time: "12:30", text: "Lunch", slot: "lunch" },
    { id: "m7", time: "15:30", text: "Snack", slot: "afternoon" }, { id: "m8", time: "17:15", text: "Finish work, head home" },
    { id: "m9", time: "17:50", text: "GYM Strength A — squats, chest press, rows, plank (45 min)" },
    { id: "m10", time: "18:45", text: "Dinner", slot: "dinner" }, { id: "m11", time: "19:30", text: "PlayStation (to 9:00)" },
    { id: "m12", time: "22:00", text: "Bed" } ] },
  { day: "Tuesday", focus: "Swim", items: [
    { id: "t1", time: "06:30", text: "Wake" }, { id: "t2", time: "06:40", text: "Dog walk (35 min)" },
    { id: "t3", time: "07:20", text: "Breakfast", slot: "breakfast" }, { id: "t4", time: "08:15", text: "Leave for work (arrive 8:45)" },
    { id: "t5", time: "10:00", text: "Snack", slot: "morning" }, { id: "t6", time: "12:30", text: "Lunch", slot: "lunch" },
    { id: "t7", time: "15:30", text: "Snack", slot: "afternoon" }, { id: "t8", time: "17:15", text: "Finish work, head home" },
    { id: "t9", time: "17:45", text: "LAP POOL — 25–30 min intervals" },
    { id: "t10", time: "18:45", text: "Dinner", slot: "dinner" }, { id: "t11", time: "19:30", text: "PlayStation (to 9:00)" },
    { id: "t12", time: "22:00", text: "Bed" } ] },
  { day: "Wednesday", focus: "Pilates (leave work early)", items: [
    { id: "w1", time: "06:30", text: "Wake" }, { id: "w2", time: "06:40", text: "Dog walk (35 min)" },
    { id: "w3", time: "07:20", text: "Breakfast", slot: "breakfast" }, { id: "w4", time: "08:15", text: "Leave for work (arrive 8:45)" },
    { id: "w5", time: "10:00", text: "Snack", slot: "morning" }, { id: "w6", time: "12:30", text: "Lunch", slot: "lunch" },
    { id: "w7", time: "15:30", text: "Snack", slot: "afternoon" }, { id: "w8", time: "16:45", text: "Leave work" },
    { id: "w9", time: "17:30", text: "PILATES (1 hr)" },
    { id: "w10", time: "19:00", text: "Dinner (reheat — no cooking)", slot: "dinner" },
    { id: "w11", time: "19:45", text: "PlayStation (to 8:45)" }, { id: "w12", time: "22:00", text: "Bed" } ] },
  { day: "Thursday", focus: "Gym — Strength B + Cook Night", items: [
    { id: "h1", time: "06:30", text: "Wake" }, { id: "h2", time: "06:40", text: "Dog walk (35 min)" },
    { id: "h3", time: "07:20", text: "Breakfast", slot: "breakfast" }, { id: "h4", time: "08:15", text: "Leave for work (arrive 8:45)" },
    { id: "h5", time: "10:00", text: "Snack", slot: "morning" }, { id: "h6", time: "12:30", text: "Lunch", slot: "lunch" },
    { id: "h7", time: "15:30", text: "Snack", slot: "afternoon" }, { id: "h8", time: "17:15", text: "Finish work, head home" },
    { id: "h9", time: "17:50", text: "GYM Strength B — deadlifts, shoulder press, pulldown, lunges (40 min)" },
    { id: "h10", time: "18:40", text: "BATCH COOK (breakfast + dinner batch) · eat tonight's serve fresh", slot: "dinner" },
    { id: "h11", time: "19:45", text: "PlayStation while food cools (to 9:00)" }, { id: "h12", time: "22:00", text: "Bed" } ] },
  { day: "Friday", focus: "Easy day", items: [
    { id: "f1", time: "06:30", text: "Wake" }, { id: "f2", time: "06:40", text: "Dog walk (35 min)" },
    { id: "f3", time: "07:20", text: "Breakfast", slot: "breakfast" }, { id: "f4", time: "08:15", text: "Leave for work (arrive 8:45)" },
    { id: "f5", time: "10:00", text: "Snack", slot: "morning" }, { id: "f6", time: "12:30", text: "Lunch", slot: "lunch" },
    { id: "f7", time: "15:30", text: "Snack", slot: "afternoon" }, { id: "f8", time: "17:15", text: "Finish work, head home" },
    { id: "f9", time: "17:45", text: "Optional easy swim or stretch — or skip it, it's Friday" },
    { id: "f10", time: "18:30", text: "Dinner", slot: "dinner" }, { id: "f11", time: "19:15", text: "PlayStation (the long one, to 8:45)" },
    { id: "f12", time: "", text: "Bed when it suits — it's the weekend" } ] },
  { day: "Saturday", focus: "Pilates + weigh-in", items: [
    { id: "s1", time: "06:15", text: "Wake · weigh-in before anything else — log it in the app" },
    { id: "s2", time: "06:20", text: "Quick dog walk (20 min)" }, { id: "s3", time: "07:00", text: "PILATES (1 hr)" },
    { id: "s4", time: "08:30", text: "Breakfast", slot: "breakfast" },
    { id: "s5", time: "10:30", text: "", slot: "morning", skipIfEmpty: true },
    { id: "s6", time: "", text: "Late morning free — errands, life admin" },
    { id: "s7", time: "12:30", text: "Lunch", slot: "lunch" }, { id: "s8", time: "15:30", text: "Snack", slot: "afternoon" },
    { id: "s9", time: "", text: "Afternoon free + PlayStation whenever suits" },
    { id: "s10", time: "18:30", text: "Dinner (flexible night — one relaxed meal a week is fine)", slot: "dinner" },
    { id: "s11", time: "", text: "Bed when it suits" } ] },
  { day: "Sunday", focus: "Park walk + Cook Night", items: [
    { id: "u1", time: "07:00", text: "Wake (sleep in)" }, { id: "u2", time: "08:00", text: "Breakfast", slot: "breakfast" },
    { id: "u3", time: "09:00", text: "LONG PARK WALK with the dog — 60–75 min" },
    { id: "u4", time: "10:30", text: "", slot: "morning", skipIfEmpty: true },
    { id: "u5", time: "12:30", text: "Lunch", slot: "lunch" }, { id: "u6", time: "15:30", text: "Snack", slot: "afternoon" },
    { id: "u7", time: "16:30", text: "BATCH COOK for Mon–Wed (breakfast + dinner batch)" },
    { id: "u8", time: "18:15", text: "Dinner fresh from the batch", slot: "dinner" },
    { id: "u9", time: "19:00", text: "PlayStation (to 8:30)" }, { id: "u10", time: "21:30", text: "Early night — Monday comes fast" } ] },
];

// ---------- storage helpers ----------
async function sGet(key, fallback) {
  try {
    const { value } = await Preferences.get({ key: "tt:" + key });
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
}
async function sSet(key, value) {
  try { await Preferences.set({ key: "tt:" + key, value: JSON.stringify(value) }); } catch (e) { console.error(e); }
}
async function sDel(key) {
  try { await Preferences.remove({ key: "tt:" + key }); } catch {}
}

// ---------- date helpers ----------
const todayISO = () => new Date().toISOString().slice(0, 10);
function weekKey(d = new Date()) {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // Mon=0
  dt.setDate(dt.getDate() - day);
  return dt.toISOString().slice(0, 10);
}
const fmtDay = (iso) => new Date(iso + "T12:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

// ---------- shared UI ----------
const font = { fontFamily: "-apple-system, 'Segoe UI', Roboto, sans-serif" };
const headFont = { fontFamily: '"SF Pro Rounded", ui-rounded, "Nunito", "Segoe UI", system-ui, sans-serif' };

const numFont = { fontFamily: "'Barlow Condensed', 'Arial Narrow', -apple-system, sans-serif" };

function Card({ children, style, className }) {
  return <div className={"tt-card" + (className ? " " + className : "")} style={{ background: "var(--surface)", borderRadius: 18, padding: 18, ...style }}>{children}</div>;
}
function Stat({ label, value, unit, accent, sub }) {
  return (
    <Card style={{ flex: "1 1 140px", minWidth: 130 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--mut)", fontWeight: 600 }}>{label}</div>
      <div style={{ ...numFont, fontSize: 40, fontWeight: 600, lineHeight: 1.1, color: accent || INK, marginTop: 2 }}>
        {value}<span style={{ fontSize: 18, color: "var(--faint)", marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}
function Btn({ children, onClick, kind = "primary", small, style }) {
  const base = { border: "none", borderRadius: 999, cursor: "pointer", fontWeight: 800, ...font, padding: small ? "8px 15px" : "12px 20px", fontSize: small ? 13 : 15 };
  const kinds = {
    primary: { background: PINE, color: "#FFFFFF" },
    teal: { background: TEAL, color: "var(--on-accent)" },
    ghost: { background: "var(--surface)", color: INK, borderWidth: 1.5, borderStyle: "solid", borderColor: "rgba(120,106,84,0.35)" },
    danger: { background: "var(--surface)", color: "#B23B2E", borderWidth: 1.5, borderStyle: "solid", borderColor: "rgba(178,59,46,0.4)" },
  };
  return <button onClick={onClick} className={"tt-btn tt-btn-" + kind} style={{ ...base, ...kinds[kind], ...style }}><span style={{ color: "inherit" }}>{children}</span></button>;
}
function ConfirmBtn({ onConfirm, children, confirmLabel = "Confirm delete?", small = true, style }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  return (
    <Btn kind="danger" small={small}
      style={{ ...(armed ? { background: "#B23B2E", color: "#FFFFFF", borderColor: "#B23B2E" } : {}), ...style }}
      onClick={() => { if (armed) { setArmed(false); onConfirm(); } else { setArmed(true); } }}>
      {armed ? confirmLabel : children}
    </Btn>
  );
}

function Toast({ msg }) {
  return (
    <div style={{
      position: "fixed", left: "50%", bottom: "calc(96px + env(safe-area-inset-bottom))", transform: "translateX(-50%) translateY(" + (msg ? "0px" : "16px") + ")",
      background: "#221D18", color: "#F2ECE0", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 999,
      opacity: msg ? 1 : 0, pointerEvents: "none", transition: "all .25s ease", zIndex: 50, whiteSpace: "nowrap", ...font,
    }}>{msg}</div>
  );
}
const inputStyle = { width: "100%", padding: "12px 12px", borderRadius: 14, border: "1.5px solid #DCD2BC", fontSize: 16, ...font, boxSizing: "border-box", background: "var(--surface2)", color: INK };

const MOTIVATION = [
  "The 7-day average is the only number that gets a vote today.",
  "You don't have to feel like training. You just have to start.",
  "Every batch cook is five future decisions you don't have to make.",
  "Motion beats mood. Move first, feel better second.",
  "Muscle keeps your metabolism honest. Lift the weights.",
  "One lap at a time. That's the whole strategy.",
  "You're not losing weight. You're building a bloke who weighs less.",
  "Discipline is remembering what you want at 3:30 in the afternoon.",
  "Today's workout is tomorrow's easier dog walk.",
  "The kitchen closes at 8. The results stay open all night.",
  "Nobody ever regretted the swim afterwards.",
  "The scales measure one morning. The trend measures you.",
  "Cook once, win six times.",
  "The reward tastes better after the work. That's just science.",
  "A bad day of eating is a data point, not a verdict.",
  "Show up average every day and the results will be exceptional.",
  "You're one session away from a better mood. Always.",
  "The outdoors is right there. Go use some of it.",
  "Strong is a skill. You're practising it twice a week.",
  "The hardest rep is putting your shoes on.",
  "Consistency beats intensity every week of the year.",
  "Your future self is watching today's 5:50 decision.",
  "Water weight lies. Keep walking.",
  "Don't break the chain. The habit grid is the real game.",
  "Fat loss is boring done right. Embrace boring.",
  "The lean mass number is your report card. Protect it.",
  "Two cook nights a week is cheaper than one bad takeaway habit.",
  "You can't out-think a workout. Just start it.",
  "Progress hides on the daily chart and shows off on the monthly one.",
  "The pool doesn't judge your pace. Neither should you.",
  "Every 'no thanks' at morning tea is a rep too.",
  "Slow is smooth. Smooth is sustainable. Sustainable wins.",
  "Whoever moves every morning is already ahead.",
  "Skip the swim if you must. Never skip the weights.",
  "Your goal isn't a dream. It's a stack of honest Saturdays away.",
  "Hunger at 9pm is usually just the day asking for sleep.",
  "You've already done the hardest part: you started.",
  "Strength training is a pension plan for your future body.",
  "Weigh in, write it down, move on. No drama.",
  "The plan works when you're tired too. Especially then.",
  "One flexible meal a week is strategy, not failure.",
  "Big goals are just small habits wearing a trench coat.",
  "Your knees in thirty years will thank the squats today.",
  "The 5pm fridge raid loses to the 3:30 snack. Every time.",
  "You don't need motivation. You have a schedule.",
  "Rest is part of the program, not a break from it.",
  "Compare yourself to March you, not to Instagram.",
  "The trend line doesn't care about one big weekend.",
  "Protein at every meal. Guard the muscle, burn the rest.",
  "Do it for the person in the mirror this time next year.",
];
function dailyMessage() {
  // Deterministic daily shuffle: hash the date to walk the list in a scrambled order
  const d = new Date();
  const dayNum = Math.floor(d.getTime() / 86400000);
  const idx = (dayNum * 37 + 11) % MOTIVATION.length; // 37 is coprime with 50 → cycles all 50 before repeating
  return MOTIVATION[idx];
}

// ---------- Dashboard ----------

// ---------- Milestones & streaks ----------
function computeMilestones(entries, workouts, goal, heightM, startWeight) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const res = [];
  if (sorted.length) {
    const start = startWeight || sorted[0].weight;
    for (let k = 1; k <= 60; k++) {
      const hit = sorted.find((e) => start - e.weight >= k);
      if (!hit) break;
      res.push({ id: "kg" + k, icon: "⚖️", label: `${k} kg down`, date: hit.date });
    }
    const h2 = heightM * heightM;
    const outObese = sorted.find((e) => e.weight / h2 < 30);
    if (outObese && sorted[0].weight / h2 >= 30) res.push({ id: "bmi30", icon: "🚪", label: "BMI out of the obese range", date: outObese.date });
    const healthy = sorted.find((e) => e.weight / h2 < 25);
    if (healthy) res.push({ id: "bmi25", icon: "💚", label: "Healthy BMI range", date: healthy.date });
    if (goal && start > goal) {
      const half = sorted.find((e) => e.weight <= start - (start - goal) / 2);
      if (half) res.push({ id: "half", icon: "⛰️", label: "Halfway to goal", date: half.date });
      const done = sorted.find((e) => e.weight <= goal);
      if (done) res.push({ id: "goal", icon: "🏆", label: `GOAL: ${goal} kg reached`, date: done.date });
    }
    for (const n of [7, 30, 100, 200]) {
      if (sorted.length >= n) res.push({ id: "log" + n, icon: "📓", label: `${n} weigh-ins logged`, date: sorted[n - 1].date });
    }
    const waists = sorted.filter((e) => e.waist);
    if (waists.length) {
      const w0 = waists[0].waist;
      for (const cm of [2, 5, 8, 12, 16, 20]) {
        const hit = waists.find((e) => w0 - e.waist >= cm);
        if (hit) res.push({ id: "waist" + cm, icon: "📏", label: `${cm} cm off the waist`, date: hit.date });
      }
    }
  }
  const wos = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
  for (const n of [1, 5, 10, 25, 50, 100]) {
    if (wos.length >= n) res.push({ id: "wo" + n, icon: "🏋️", label: n === 1 ? "First workout logged" : `${n} workouts logged`, date: wos[n - 1].date });
  }
  return res.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}
function calcStreak(entries) {
  const dates = new Set(entries.map((e) => e.date));
  const dayMs = 86400000;
  let d = new Date(todayISO() + "T12:00");
  if (!dates.has(todayISO())) d = new Date(d.getTime() - dayMs); // streak can survive until tonight
  let n = 0;
  while (true) {
    const k = d.toISOString().slice(0, 10);
    if (dates.has(k)) { n++; d = new Date(d.getTime() - dayMs); }
    else if (isHoliday(k, arguments[1] || [])) { d = new Date(d.getTime() - dayMs); }
    else break;
  }
  return n;
}


function isHoliday(dateISO, holidays = []) {
  return holidays.some((h) => dateISO >= h.s && (!h.e || dateISO <= h.e));
}
function buildCsv(entries, water = {}, glp = {}, workouts = [], heightM = 1.78) {
  const dates = new Set([...entries.map((e) => e.date), ...Object.keys(water), ...Object.keys(glp), ...workouts.map((w) => w.date)]);
  const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const rows = [["Date", "Weight kg", "Body fat %", "Waist cm", "Neck cm", "Chest cm", "BMI", "Water glasses", "Injection day", "Dose", "Site", "Symptom load", "Symptoms", "Food noise", "Fibre g", "Mood", "Bowel", "Workouts", "Note"]];
  [...dates].sort().forEach((d) => {
    const e = entries.find((x) => x.date === d) || {};
    const g = glp[d] || {};
    const syms = Object.entries(g.symptoms || {}).filter(([, v]) => v > 0);
    const load = syms.reduce((a, [, v]) => a + v, 0);
    const wos = workouts.filter((w) => w.date === d).map((w) => w.name).join(" + ");
    rows.push([d, e.weight ?? "", e.bodyFat ?? "", e.waist ?? "", e.neck ?? "", e.chest ?? "", e.weight ? (e.weight / (heightM * heightM)).toFixed(1) : "", water[d] ?? "", g.injection ? "Y" : "", g.med ? `${g.med.name || ""} ${g.med.dose || ""}`.trim() : "", g.site || "", load || "", syms.map(([s, v]) => `${s}:${v}`).join("; "), g.foodNoise ?? "", g.fibre ?? "", g.mood ?? "", g.bowel === true ? "Y" : g.bowel === false ? "N" : "", wos, [e.note, g.note].filter(Boolean).join(" | ")]);
  });
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}

// ---------- Today ----------
function Today({ profile, entries, saveEntries, habits, saveHabits, week, supps, water, saveWater, workouts, goal, heightM, seenMs, saveSeenMs, schedDone, saveSchedDone, accent = "#C9922B", holidays = [], glp = {}, glpEnabled = false, go }) {
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const dayIdx = (new Date().getDay() + 6) % 7;
  const d = week[dayIdx];
  const forSlot = (slot) => supps.filter((s) => s.slot === slot).map((s) => s.name).join(" + ");
  const hasToday = entries.some((e) => e.date === todayISO());
  const cups = water[todayISO()] || 0;
  const setCups = (n) => saveWater({ ...water, [todayISO()]: n });
  const priorHabitList = (() => {
    const keys = Object.keys(habits).filter((k) => k < weekKey()).sort();
    for (let i = keys.length - 1; i >= 0; i--) { if (habits[keys[i]]?.list?.length) return habits[keys[i]].list; }
    return DEFAULT_HABITS;
  })();
  const wk = habits[weekKey()] || { list: priorHabitList, checks: {} };
  const hList = wk.list || priorHabitList;
  const dayKey = DAYS[dayIdx];
  const toggleHabit = (h) => {
    const checks = { ...wk.checks, [h]: { ...(wk.checks[h] || {}), [dayKey]: !(wk.checks[h] || {})[dayKey] } };
    saveHabits({ ...habits, [weekKey()]: { ...wk, list: hList, checks } });
  };
  const ms = computeMilestones(entries, workouts, goal, heightM, parseFloat(profile.startWeight));
  const fresh = ms.filter((m) => !seenMs.includes(m.id));
  const holidayActive = holidays.some((h) => !h.e);
  const streak = calcStreak(entries, holidays);
  const saveEntry = () => {
    const w = parseFloat(weight);
    if (!w) return;
    saveEntries([...entries.filter((e) => e.date !== todayISO()), { date: todayISO(), weight: w, bodyFat: parseFloat(bf) || null }]);
    setWeight(""); setBf("");
  };
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isPast = (t) => { if (!t) return false; const [h, m] = t.split(":").map(Number); return h * 60 + m < nowMin; };
  const done = schedDone[todayISO()] || {};
  const toggleDone = (id) => {
    const today = { ...done, [id]: !done[id] };
    // keep only the last 7 days of history
    const keep = {};
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    Object.entries(schedDone).forEach(([k, v]) => { if (k >= cutoff) keep[k] = v; });
    saveSchedDone({ ...keep, [todayISO()]: today });
  };
  const visible = d.items.filter((it) => {
    const extra = it.slot ? forSlot(it.slot) : "";
    return !(it.skipIfEmpty && !extra && !it.text) && (it.text || extra);
  });
  const doneCount = visible.filter((it) => done[it.id]).length;
  const nextItem = visible.find((it) => it.time && !isPast(it.time) && !done[it.id]) || visible.find((it) => it.time && !done[it.id]);

  return (
    <div className="tt-cols">
      <div style={{ marginBottom: 12 }}>
        <div style={{ ...numFont, fontSize: 24, ...headFont, fontWeight: 800, color: PINE_T }}>
          {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}{profile.name ? `, ${profile.name.split(" ")[0]}` : ""}
        </div>
        <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--mut)", marginTop: 2 }}>{dailyMessage()}</div>
      </div>

      {!(parseFloat(profile.heightCm) > 0 && parseFloat(profile.startWeight) > 0) && (
        <Card className="tt-span2" style={{ marginBottom: 12, padding: 0, overflow: "hidden", borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: accent }}>
          <button onClick={() => go("me")} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", ...font }}>
            <div style={{ ...headFont, fontWeight: 800, color: PINE_T, fontSize: 15 }}>👋 Welcome to Trend — finish setting up</div>
            <div style={{ fontSize: 13, color: "var(--mut)", marginTop: 3 }}>Add your height, weight and goal to unlock BMI, calorie targets and goal projections. Everything else already works.</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginTop: 6 }}>Set up in the Me tab →</div>
          </button>
        </Card>
      )}

      {holidayActive && (
        <Card style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: "#D9A621" }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T }}>🏖 Holiday mode is on</div>
          <div style={{ fontSize: 13, color: "var(--mut)", marginTop: 2 }}>Streak paused, verdicts softened. Log if you feel like it — or don't. Turn it off in the Me tab when you're back.</div>
        </Card>
      )}
      {fresh.length > 0 && (
        <Card style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: "#4C8767", background: "var(--teal-soft)" }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 6 }}>🎉 Milestone{fresh.length > 1 ? "s" : ""} unlocked</div>
          {fresh.map((m) => <div key={m.id} style={{ fontSize: 15, padding: "3px 0" }}>{m.icon} {m.label}</div>)}
          <div style={{ marginTop: 8 }}><Btn kind="teal" small onClick={() => saveSeenMs([...seenMs, ...fresh.map((m) => m.id)])}>Nice — got it</Btn></div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "var(--mut)", fontWeight: 600 }}>Streak</div>
          <div style={{ ...numFont, fontSize: 36, fontWeight: 800, color: streak >= 3 ? GOOD : INK }}>{streak > 0 ? `🔥 ${streak}` : "—"}<span style={{ fontSize: 13, color: "var(--faint)" }}> {streak === 1 ? "day" : "days"}</span></div>
        </Card>
        <Card style={{ flex: 1.6, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "var(--mut)", fontWeight: 600 }}>Water · <span style={{ color: cups >= 8 ? GOOD : TEAL, fontWeight: 700 }}>{cups}/8</span></div>
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <button key={i} onClick={() => setCups(i + 1 === cups ? i : i + 1)} style={{
                flex: 1, minWidth: 0, height: 34, borderRadius: "0 0 9px 9px", cursor: "pointer",
                WebkitAppearance: "none", appearance: "none", padding: 0, boxSizing: "border-box",
                borderWidth: 2, borderStyle: "solid",
                borderColor: i < cups ? accent : "#A69C8C",
                background: i < cups ? accent : "rgba(166,156,140,0.18)",
              }} />
            ))}
          </div>
        </Card>
        {glpEnabled && (() => {
          const n = daysSinceDose(glp, todayISO());
          if (n == null) return null;
          return (
            <Card style={{ flex: 0.8, padding: "12px 14px", minWidth: 90 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "var(--mut)", fontWeight: 600 }}>Dose</div>
              <div style={{ ...numFont, fontSize: 36, fontWeight: 800, color: accent }}>Day {n}</div>
            </Card>
          );
        })()}
      </div>

      {!hasToday && !holidayActive && (
        <Card style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: "#C9922B" }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 8 }}>Morning weigh-in — not logged yet</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" inputMode="decimal" placeholder="Weight kg" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            <input type="number" inputMode="decimal" placeholder="BF %" value={bf} onChange={(e) => setBf(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            <Btn onClick={saveEntry}>Save</Btn>
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T }}>{d.day} — {d.focus} <span style={{ fontSize: 12, color: doneCount === visible.length && visible.length ? GOOD : "var(--faint)", fontWeight: 600 }}>· {doneCount}/{visible.length}{doneCount === visible.length && visible.length ? " ✓" : ""}</span></div>
          <button onClick={() => go("week")} style={{ border: "none", background: "none", color: TEAL, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Full week →</button>
        </div>
        {visible.map((it) => {
          const extra = it.slot ? forSlot(it.slot) : "";
          const body = [it.text, extra].filter(Boolean).join(" + ");
          const hot = it.text.match(/GYM|POOL|PILATES|PARK WALK|BATCH COOK/);
          const isDone = !!done[it.id];
          const past = isPast(it.time) && !isDone && nextItem && it !== nextItem;
          const isNext = nextItem && it === nextItem;
          return (
            <button key={it.id} onClick={() => toggleDone(it.id)} style={{ width: "100%", textAlign: "left", background: "none", border: "none", borderTop: "1px solid rgba(120,106,84,0.22)", padding: "8px 0", fontSize: 14, display: "flex", gap: 9, alignItems: "flex-start", cursor: "pointer", ...font, opacity: past ? 0.5 : 1 }}>
              <span style={{
                width: 21, height: 21, borderRadius: "50%", flexShrink: 0, marginTop: 0,
                border: isDone ? "none" : "2px solid rgba(120,106,84,0.35)",
                background: isDone ? GOOD : "transparent",
                color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>{isDone ? "✓" : ""}</span>
              <span style={{ ...numFont, fontWeight: 700, color: isNext ? TEAL : "var(--faint)", minWidth: 42, flexShrink: 0, fontSize: 15 }}>{fmtTime(it.time)}</span>
              <span style={{
                color: isDone ? "var(--faint)" : hot ? TEAL : INK,
                fontWeight: hot || isNext ? 600 : 400,
                textDecoration: isDone ? "line-through" : "none",
              }}>{body}{isNext && !isDone ? "  ← next" : ""}</span>
            </button>
          );
        })}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T }}>Today's habits</div>
          <button onClick={() => go("habits")} style={{ border: "none", background: "none", color: TEAL, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>Week grid →</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {hList.map((h) => {
            const on = (wk.checks[h] || {})[dayKey];
            return (
              <button key={h} onClick={() => toggleHabit(h)} style={{
                padding: "9px 13px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, ...font,
                border: on ? "none" : "1.5px solid rgba(120,106,84,0.35)",
                background: on ? TEAL : "var(--surface)", color: on ? "#fff" : "var(--mut)",
              }}>{on ? "✓ " : ""}{h}</button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Dashboard({ entries, habits, goal, setGoal, heightM = HEIGHT_M, profile = {}, workouts = [], water = {}, saveWater, dark = false, pal = COLOR_THEMES[0], holidays = [], glp = {} }) {
  const cGrid = dark ? "#332B21" : "#E2D9C8";
  const cTick = dark ? "#C9BEAE" : "#6B6055";
  const cAvg = dark ? pal.ptD : pal.primary;
  const cDaily = dark ? "#6E6252" : "#C4B69F";
  const cBf = "#D9A621";
  const cWaist = dark ? "#C7A15F" : "#8A6D3B";
  const energy = calcEnergy(profile, entries);
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const start = sorted[0];
  const mean = (arr) => arr.reduce((s, e) => s + e.weight, 0) / arr.length;
  const chartData = sorted.map((e, i) => {
    const win = sorted.slice(Math.max(0, i - 6), i + 1);
    return { date: fmtDay(e.date), weight: e.weight, avg7: +(win.reduce((s, x) => s + x.weight, 0) / win.length).toFixed(1), bf: e.bodyFat || null, waist: e.waist || null, neck: e.neck || null, chest: e.chest || null };
  });
  const avg7 = chartData.length ? chartData[chartData.length - 1].avg7 : null;
  const bmi = latest ? latest.weight / (heightM * heightM) : null;
  const bmiCat = bmi == null ? "" : bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy range" : bmi < 30 ? "Overweight" : "Obese";
  const fatKg = latest?.bodyFat ? (latest.weight * latest.bodyFat) / 100 : null;
  const latestWaist = [...sorted].reverse().find((e) => e.waist)?.waist || null;
  const lost = start && latest ? start.weight - latest.weight : 0;
  const progress = start && goal && start.weight !== goal ? Math.max(0, Math.min(100, ((start.weight - (latest?.weight ?? start.weight)) / (start.weight - goal)) * 100)) : 0;
  const wk = habits[weekKey()] || {};
  const habitList = wk.list || DEFAULT_HABITS; // display only
  const done = Object.values(wk.checks || {}).flatMap(Object.values).filter(Boolean).length;
  const habitPct = Math.round((done / (habitList.length * 7)) * 100);

  // ---- goal projection from logged trend ----
  const dayMs = 86400000;
  const proj = (() => {
    if (!goal || goal <= 0) return { msg: "Set a goal weight in the Me tab for a projection" };
    if (sorted.length < 5) return { msg: "Log two weeks of weigh-ins to unlock a goal projection" };
    const firstD = new Date(sorted[0].date), lastD = new Date(sorted[sorted.length - 1].date);
    const span = (lastD - firstD) / dayMs;
    if (span < 14) return { msg: "Log two weeks of weigh-ins to unlock a goal projection" };
    const lastWin = sorted.filter((e) => new Date(e.date) >= new Date(lastD.getTime() - 6 * dayMs));
    const firstWin = sorted.filter((e) => new Date(e.date) <= new Date(firstD.getTime() + 6 * dayMs));
    const rate = (mean(firstWin) - mean(lastWin)) / (span / 7); // kg lost per week
    if (mean(lastWin) - goal <= 0) return { msg: "You're at goal — switch to the maintain calorie target", good: true };
    if (rate < 0.05) return { msg: "Trend is flat over the logged period — check the calorie target and the projection will appear" };
    const eta = new Date(lastD.getTime() + ((mean(lastWin) - goal) / rate) * 7 * dayMs);
    if ((eta - lastD) / dayMs > 550) return { msg: `Losing ${rate.toFixed(2)} kg/wk — too slow to project reliably` };
    return { msg: `At your logged pace (−${rate.toFixed(2)} kg/wk): ${goal} kg around ${eta.toLocaleDateString(undefined, { day: "numeric", month: "short", year: eta.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined })}`, good: true };
  })();

  // ---- weekly review ----
  const wkStart = new Date(weekKey() + "T00:00");
  const woThisWeek = workouts.filter((w) => new Date(w.date + "T12:00") >= wkStart).length;
  let wkChange = null;
  if (latest) {
    const end = new Date(latest.date);
    const w1 = sorted.filter((e) => new Date(e.date) > new Date(end.getTime() - 7 * dayMs));
    const w0 = sorted.filter((e) => { const t = new Date(e.date); return t <= new Date(end.getTime() - 7 * dayMs) && t > new Date(end.getTime() - 14 * dayMs); });
    if (w0.length && w1.length) wkChange = mean(w1) - mean(w0);
  }
  const holidayActive = holidays.some((h) => !h.e);
  const verdict = holidayActive ? "Holiday mode — the verdict is on the beach too. Pick the plan back up when you're home."
    : wkChange == null ? "Log a second week of weigh-ins for the weekly verdict."
    : wkChange <= -0.3 && habitPct >= 70 ? "Textbook week — losing at a healthy clip with the habits holding."
    : wkChange <= -0.1 ? "Moving the right way. Keep the habit grid ticking and this compounds."
    : wkChange <= 0.15 ? "Scales flat this week — usually water. Check the habit grid, hold the plan."
    : "Up this week. One week is noise, two is a signal — review the calorie target.";

  return (
    <div className="tt-cols">
      {/* Scoreboard hero */}
      <div style={{ background: PINE, borderRadius: 18, padding: "22px 20px", color: "var(--surface)", marginBottom: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.75 }}>7-day average — your real scoreboard</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <div style={{ ...numFont, fontSize: 76, fontWeight: 700, lineHeight: 1 }}>{avg7 ?? "—"}<span style={{ fontSize: 26, opacity: 0.7 }}> kg</span></div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            {latest ? <>latest weigh-in <b>{latest.weight} kg</b> · lost <b>{lost.toFixed(1)} kg</b> so far</> : "Log your first weigh-in to start the board"}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ height: 10, background: "rgba(255,255,255,0.2)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "rgba(255,255,255,0.82)", borderRadius: 6, transition: "width .4s" }} />
          </div>
          <div style={{ fontSize: 12, marginTop: 5, opacity: 0.85, display: "flex", justifyContent: "space-between" }}>
            <span>{goal > 0 ? `${progress.toFixed(0)}% to goal` : "Set a goal in Me"}{energy.target ? <> · daily target <b>{energy.target} cal</b></> : ""}</span>
            <span>goal <input type="number" value={goal} onChange={(e) => setGoal(parseFloat(e.target.value) || goal)}
              style={{ width: 56, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)", color: "var(--surface)", borderRadius: 6, padding: "2px 6px", fontSize: 13, textAlign: "center" }} /> kg</span>
          </div>
          <div style={{ fontSize: 12, marginTop: 6, color: proj.good ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)", fontWeight: proj.good ? 600 : 400 }}>◈ {proj.msg}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Stat label="Body fat" value={latest?.bodyFat ?? "—"} unit="%" accent={TEAL} />
        <Stat label="Waist" value={latestWaist ?? "—"} unit="cm" sub="best fat-loss signal" />
        <Stat label="BMI" value={bmi ? bmi.toFixed(1) : "—"} unit="" sub={bmiCat} accent={bmi && bmi < 25 ? GOOD : AMBER} />
        <Stat label="Fat mass" value={fatKg ? fatKg.toFixed(1) : "—"} unit="kg" />
        <Stat label="Lean mass" value={fatKg && latest ? (latest.weight - fatKg).toFixed(1) : "—"} unit="kg" sub="keep this steady" />
        <Stat label="Habits this week" value={habitPct} unit="%" accent={habitPct >= 70 ? GOOD : AMBER} />
      </div>

      {/* Weekly review */}
      <Card style={{ marginBottom: 14, borderLeft: `4px solid ${wkChange != null && wkChange <= -0.1 ? GOOD : AMBER}` }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--mut)", fontWeight: 700, marginBottom: 6 }}>This week's review</div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 8 }}>
          <div><span style={{ fontSize: 12, color: "var(--mut)" }}>Weight vs last wk</span><div style={{ ...numFont, fontSize: 24, fontWeight: 700, color: wkChange == null ? "var(--faint)" : wkChange <= 0 ? GOOD : AMBER }}>{wkChange == null ? "—" : `${wkChange > 0 ? "+" : ""}${wkChange.toFixed(1)} kg`}</div></div>
          <div><span style={{ fontSize: 12, color: "var(--mut)" }}>Habits</span><div style={{ ...numFont, fontSize: 24, fontWeight: 700 }}>{habitPct}%</div></div>
          <div><span style={{ fontSize: 12, color: "var(--mut)" }}>Workouts logged</span><div style={{ ...numFont, fontSize: 24, fontWeight: 700 }}>{woThisWeek}</div></div>
        </div>
        <div style={{ fontSize: 13.5, color: INK }}>{verdict}</div>
      </Card>

      {(() => {
        const ms = computeMilestones(entries, workouts, goal, heightM, parseFloat(profile.startWeight)).reverse();
        return (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: PINE_T }}>Milestones <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 400 }}>· {ms.length} unlocked</span></div>
            {ms.length === 0 ? <div style={{ color: "var(--mut)", fontSize: 14 }}>Your first milestone (1 kg down) is closer than you think.</div> :
              ms.slice(0, 8).map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(120,106,84,0.22)", fontSize: 14 }}>
                  <span>{m.icon} {m.label}</span>
                  <span style={{ color: "var(--faint)", fontSize: 12 }}>{m.date ? fmtDay(m.date) : ""}</span>
                </div>
              ))}
            {ms.length > 8 && <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 4 }}>…and {ms.length - 8} more</div>}
          </Card>
        );
      })()}


      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: PINE_T }}>Weight trend</div>
        {chartData.length < 2 ? <div style={{ color: "var(--mut)", fontSize: 14 }}>Log a few days of weigh-ins and your trend appears here.</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={cGrid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: cTick }} interval="preserveStartEnd" />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: cTick }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid rgba(120,106,84,0.22)", borderRadius: 8, color: "var(--ink)" }} labelStyle={{ color: "var(--ink)" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--mut)" }} />
              <Line type="monotone" dataKey="weight" name="Daily" stroke={cDaily} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="avg7" name="7-day avg" stroke={cAvg} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: TEAL }}>Body fat % trend</div>
        {chartData.filter((d) => d.bf).length < 2 ? <div style={{ color: "var(--mut)", fontSize: 14 }}>Add body fat readings to see the trend. Scale body-fat % is noisy in absolute terms — trust the direction of the line, not any single number.</div> : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData.filter((d) => d.bf)} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={cGrid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: cTick }} interval="preserveStartEnd" />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: cTick }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid rgba(120,106,84,0.22)", borderRadius: 8, color: "var(--ink)" }} labelStyle={{ color: "var(--ink)" }} />
              <Line type="monotone" dataKey="bf" name="Body fat %" stroke={cBf} strokeWidth={1.75} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, color: PINE_T }}>Measurements trend (cm)</div>
        {chartData.filter((d) => d.waist || d.neck || d.chest).length < 2 ? <div style={{ color: "var(--mut)", fontSize: 14 }}>Log waist (weekly), and neck/chest if you like, in the Daily Log. When the scales stall but the tape keeps moving, it's water or muscle — not failure.</div> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData.filter((d) => d.waist || d.neck || d.chest)} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={cGrid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: cTick }} interval="preserveStartEnd" />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: cTick }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid rgba(120,106,84,0.22)", borderRadius: 8, color: "var(--ink)" }} labelStyle={{ color: "var(--ink)" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--mut)" }} />
              <Line type="monotone" dataKey="waist" name="Waist" stroke={cWaist} strokeWidth={1.75} dot={false} connectNulls />
              <Line type="monotone" dataKey="neck" name="Neck" stroke={dark ? "#C2A67E" : "#8A6F45"} strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="chest" name="Chest" stroke={dark ? "#D19A8C" : "#9C5F4F"} strokeWidth={1.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {profile.glpEnabled && (() => {
        const injDates = Object.entries(glp).filter(([, v]) => v.injection).map(([k]) => k).sort();
        if (!injDates.length) return null;
        const buckets = Array.from({ length: 8 }).map(() => ({ load: [], noise: [] }));
        Object.entries(glp).forEach(([d, e]) => {
          const prior = injDates.filter((x) => x <= d);
          if (!prior.length) return;
          const dsd = Math.min(7, Math.round((new Date(d) - new Date(prior[prior.length - 1])) / 86400000));
          const load = Object.values(e.symptoms || {}).reduce((a, b) => a + (b || 0), 0);
          if (load || Object.keys(e.symptoms || {}).length) buckets[dsd].load.push(load);
          if (e.foodNoise) buckets[dsd].noise.push(e.foodNoise);
        });
        const data = buckets.map((b, i) => ({
          day: i === 7 ? "7+" : "Day " + i,
          load: b.load.length ? +(b.load.reduce((a, x) => a + x, 0) / b.load.length).toFixed(1) : null,
          noise: b.noise.length ? +(b.noise.reduce((a, x) => a + x, 0) / b.noise.length).toFixed(1) : null,
        }));
        if (!data.some((d) => d.load != null || d.noise != null)) return null;
        const accLit = dark ? pal.accD : pal.accL;
        return (
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: PINE_T }}>GLP-1 · pattern by days since dose</div>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={data} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={cGrid} strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: cTick }} />
                <YAxis domain={[0, "auto"]} tick={{ fontSize: 11, fill: cTick }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid rgba(120,106,84,0.22)", borderRadius: 8, color: "var(--ink)" }} labelStyle={{ color: "var(--ink)" }} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--mut)" }} />
                <Line type="monotone" dataKey="load" name="Avg side-effect load" stroke="#B23B2E" strokeWidth={1.75} dot connectNulls />
                <Line type="monotone" dataKey="noise" name="Avg food noise (1–10)" stroke={accLit} strokeWidth={1.75} dot connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>Averaged across every logged dose cycle. Symptoms spiking at Day 1–2, or food noise creeping back by Day 6, are exactly the patterns to show your prescriber.</div>
          </Card>
        );
      })()}
    </div>
  );
}

// ---------- Daily Log ----------
const GYM_TEMPLATES = {
  "Strength A": ["Squats / leg press", "Chest press", "Rows", "Plank"],
  "Strength B": ["Deadlifts / RDLs", "Shoulder press", "Lat pulldown", "Lunges"],
};

function DailyLog({ entries, save, heightM = HEIGHT_M, workouts = [], saveWorkouts }) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [waist, setWaist] = useState("");
  const [neck, setNeck] = useState("");
  const [chest, setChest] = useState("");
  const [note, setNote] = useState("");
  const [wo, setWo] = useState(null);
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const pastWo = [...workouts].sort((a, b) => b.date.localeCompare(a.date));

  const add = () => {
    const w = parseFloat(weight);
    if (!w) return;
    const next = entries.filter((e) => e.date !== date);
    next.push({ date, weight: w, bodyFat: parseFloat(bf) || null, waist: parseFloat(waist) || null, neck: parseFloat(neck) || null, chest: parseFloat(chest) || null, note: note.trim() || null });
    save(next);
    setWeight(""); setBf(""); setWaist(""); setNeck(""); setChest(""); setNote("");
  };

  const startWo = (name) => {
    const last = pastWo.find((w) => w.name === name);
    const exercises = last ? last.exercises.map((e) => ({ ...e })) : (GYM_TEMPLATES[name] || [""]).map((n) => ({ name: n, weight: "", sets: "3", reps: "8" }));
    setWo({ name, exercises });
  };
  const setEx = (i, patch) => setWo({ ...wo, exercises: wo.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const lastOf = (name, exName) => {
    const last = pastWo.find((w) => w.name === name && w.exercises.some((e) => e.name === exName && e.weight));
    const ex = last?.exercises.find((e) => e.name === exName);
    return ex ? `${ex.weight}kg ${ex.sets}×${ex.reps}` : null;
  };
  const saveWo = () => {
    const clean = wo.exercises.filter((e) => e.name.trim());
    if (!clean.length) { setWo(null); return; }
    saveWorkouts([...workouts, { id: "w" + Date.now(), date: todayISO(), name: wo.name, exercises: clean }]);
    setWo(null);
  };

  const miniInput = { ...inputStyle, minWidth: 0, padding: "8px 6px", fontSize: 13, textAlign: "center" };

  return (
    <div className="tt-cols">
      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 10 }}>Morning weigh-in</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div style={{ gridColumn: "1 / -1", minWidth: 0 }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, minHeight: 48, minWidth: 0, maxWidth: "100%", WebkitAppearance: "none", appearance: "none", textAlign: "left" }} />
          </div>
          <input type="number" inputMode="decimal" placeholder="Weight kg" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ ...inputStyle, minWidth: 0 }} />
          <input type="number" inputMode="decimal" placeholder="Body fat %" value={bf} onChange={(e) => setBf(e.target.value)} style={{ ...inputStyle, minWidth: 0 }} />
          <input type="number" inputMode="decimal" placeholder="Waist cm" value={waist} onChange={(e) => setWaist(e.target.value)} style={{ ...inputStyle, minWidth: 0 }} />
          <input type="number" inputMode="decimal" placeholder="Neck cm" value={neck} onChange={(e) => setNeck(e.target.value)} style={{ ...inputStyle, minWidth: 0 }} />
          <input type="number" inputMode="decimal" placeholder="Chest cm" value={chest} onChange={(e) => setChest(e.target.value)} style={{ ...inputStyle, minWidth: 0 }} />
          <span />
          <input placeholder="Note — sleep, meals out, how you feel (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, minWidth: 0, gridColumn: "1 / -1" }} />
        </div>
        <div style={{ marginTop: 12 }}><Btn onClick={add} style={{ width: "100%" }}>Save entry</Btn></div>
        <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 8 }}>Same time each morning. Waist weekly is plenty — navel height, tape relaxed. Re-saving a date replaces that day.</div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 10 }}>Gym log</div>
        {!wo ? (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn kind="teal" small style={{ flex: 1 }} onClick={() => startWo("Strength A")}>Strength A</Btn>
              <Btn kind="teal" small style={{ flex: 1 }} onClick={() => startWo("Strength B")}>Strength B</Btn>
              <Btn kind="ghost" small style={{ flex: 1 }} onClick={() => startWo("Custom")}>Custom</Btn>
            </div>
            {pastWo.slice(0, 6).map((w) => (
              <div key={w.id} style={{ borderTop: "1px solid #EAE2D3", marginTop: 10, paddingTop: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{w.name} <span style={{ color: "var(--faint)", fontWeight: 400, fontSize: 12 }}>· {fmtDay(w.date)}</span></div>
                  <div style={{ fontSize: 12.5, color: "var(--mut)" }}>{w.exercises.map((e) => `${e.name} ${e.weight ? e.weight + "kg " : ""}${e.sets}×${e.reps}`).join(" · ")}</div>
                </div>
                <button onClick={() => saveWorkouts(workouts.filter((x) => x.id !== w.id))} style={{ border: "none", background: "none", color: "#B77", cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
            ))}
            {!pastWo.length && <div style={{ fontSize: 13, color: "var(--mut)", marginTop: 10 }}>Tap a session to log it. Next time, your last numbers pre-fill — beat them when you can, that's progressive overload doing its job.</div>}
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{wo.name} — today</div>
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 0.8fr 0.8fr auto", gap: 6, fontSize: 11, color: "var(--mut)", fontWeight: 700, marginBottom: 4 }}>
              <span>EXERCISE</span><span style={{ textAlign: "center" }}>KG</span><span style={{ textAlign: "center" }}>SETS</span><span style={{ textAlign: "center" }}>REPS</span><span />
            </div>
            {wo.exercises.map((e, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 0.8fr 0.8fr auto", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  <input value={e.name} placeholder="Exercise" onChange={(ev) => setEx(i, { name: ev.target.value })} style={{ ...miniInput, textAlign: "left" }} />
                  {lastOf(wo.name, e.name) && <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 1 }}>last: {lastOf(wo.name, e.name)}</div>}
                </div>
                <input type="number" inputMode="decimal" value={e.weight} onChange={(ev) => setEx(i, { weight: ev.target.value })} style={miniInput} />
                <input type="number" inputMode="numeric" value={e.sets} onChange={(ev) => setEx(i, { sets: ev.target.value })} style={miniInput} />
                <input type="number" inputMode="numeric" value={e.reps} onChange={(ev) => setEx(i, { reps: ev.target.value })} style={miniInput} />
                <button onClick={() => setWo({ ...wo, exercises: wo.exercises.filter((_, j) => j !== i) })} style={{ border: "none", background: "none", color: "#B77", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Btn kind="ghost" small onClick={() => setWo({ ...wo, exercises: [...wo.exercises, { name: "", weight: "", sets: "3", reps: "8" }] })}>+ Exercise</Btn>
              <Btn small style={{ flex: 1 }} onClick={saveWo}>Save workout</Btn>
              <Btn kind="danger" small onClick={() => setWo(null)}>Discard</Btn>
            </div>
          </>
        )}
      </Card>

      {sorted.map((e) => (
        <Card key={e.date} style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{fmtDay(e.date)}</div>
            <div style={{ fontSize: 13, color: "var(--mut)" }}>
              {e.weight} kg{e.bodyFat ? ` · ${e.bodyFat}% BF` : ""}{e.waist ? ` · ${e.waist}cm waist` : ""}{e.neck ? ` · ${e.neck}cm neck` : ""}{e.chest ? ` · ${e.chest}cm chest` : ""} · BMI {(e.weight / (heightM * heightM)).toFixed(1)}
            </div>
            {e.note && <div style={{ fontSize: 12.5, color: "var(--gold)", fontStyle: "italic", marginTop: 2 }}>“{e.note}”</div>}
          </div>
          <Btn kind="danger" small onClick={() => save(entries.filter((x) => x.date !== e.date))}>Delete</Btn>
        </Card>
      ))}
      {!sorted.length && <div style={{ textAlign: "center", color: "var(--mut)", padding: 30 }}>No entries yet — Saturday morning is a great time to start.</div>}
    </div>
  );
}

// ---------- Habits ----------
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function Habits({ habits, save }) {
  const wk = weekKey();
  const priorList = (() => {
    const keys = Object.keys(habits).filter((k) => k < wk).sort();
    for (let i = keys.length - 1; i >= 0; i--) { if (habits[keys[i]]?.list?.length) return habits[keys[i]].list; }
    return DEFAULT_HABITS;
  })();
  const week = habits[wk] || { list: priorList, checks: {} };
  const list = week.list || priorList;
  const [newHabit, setNewHabit] = useState("");

  const toggle = (h, d) => {
    const checks = { ...week.checks, [h]: { ...(week.checks[h] || {}), [d]: !(week.checks[h] || {})[d] } };
    save({ ...habits, [wk]: { ...week, list, checks } });
  };
  const addHabit = () => {
    if (!newHabit.trim()) return;
    save({ ...habits, [wk]: { ...week, list: [...list, newHabit.trim()], checks: week.checks } });
    setNewHabit("");
  };
  const removeHabit = (h) => {
    const checks = { ...week.checks }; delete checks[h];
    save({ ...habits, [wk]: { ...week, list: list.filter((x) => x !== h), checks } });
  };

  return (
    <div>
      <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 10 }}>Week starting {fmtDay(wk)} — tap a circle to mark it done. A fresh grid starts every Monday.</div>
      {list.map((h) => {
        const row = week.checks[h] || {};
        const count = DAYS.filter((d) => row[d]).length;
        return (
          <Card key={h} style={{ marginBottom: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{h}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ ...numFont, fontSize: 18, fontWeight: 700, color: count >= 5 ? GOOD : "var(--mut)" }}>{count}/7</span>
                <button onClick={() => removeHabit(h)} style={{ border: "none", background: "none", color: "#B77", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
              {DAYS.map((d) => (
                <button key={d} onClick={() => toggle(h, d)} style={{
                  flex: 1, aspectRatio: "1", maxWidth: 46, borderRadius: "50%", border: row[d] ? "none" : "2px solid #DCD2BC",
                  background: row[d] ? TEAL : "var(--surface)", color: row[d] ? "#fff" : "var(--mut)", fontWeight: 600, fontSize: 12, cursor: "pointer",
                }}>{d[0]}</button>
              ))}
            </div>
          </Card>
        );
      })}
      <Card style={{ display: "flex", gap: 8 }}>
        <input placeholder="Add a habit…" value={newHabit} onChange={(e) => setNewHabit(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <Btn kind="teal" onClick={addHabit}>Add</Btn>
      </Card>
    </div>
  );
}

// ---------- Schedule ----------
function fmtTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h}:${String(m).padStart(2, "0")}`;
}
function sortDayItems(items) {
  // Timed items sort chronologically; untimed items keep their relative position
  const timed = items.filter((i) => i.time).sort((a, b) => a.time.localeCompare(b.time));
  const result = [];
  let ti = 0;
  for (const it of items) {
    if (it.time) { result.push(timed[ti++]); } else { result.push(it); }
  }
  return result;
}

function Schedule({ supps = DEFAULT_SUPPS, week = DEFAULT_WEEK, saveWeek }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: "long" });
  const [open, setOpen] = useState({ [today]: true });
  const [editDay, setEditDay] = useState(null);
  const toggle = (d) => setOpen({ ...open, [d]: !open[d] });
  const forSlot = (slot) => supps.filter((s) => s.slot === slot).map((s) => s.name).join(" + ");
  const customs = supps.filter((s) => s.slot === "custom");
  const rhythm = ["breakfast", "morning", "lunch", "afternoon", "dinner"]
    .map((sl) => { const t = forSlot(sl); return t ? `${t} ${SLOT_LABELS[sl]}` : null; })
    .filter(Boolean)
    .concat(customs.map((s) => `${s.name} (${s.note || "your chosen time"})`))
    .join(" · ");

  const updateDay = (di, items) => {
    const next = week.map((d, i) => (i === di ? { ...d, items: sortDayItems(items) } : d));
    saveWeek(next);
  };
  const updateItem = (di, id, patch) => updateDay(di, week[di].items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const move = (di, idx, dir) => {
    const items = [...week[di].items];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    [items[idx], items[j]] = [items[j], items[idx]];
    const next = week.map((d, i) => (i === di ? { ...d, items } : d)); // no auto-sort on manual move
    saveWeek(next);
  };
  const resetDay = (di) => {
    if (!confirm(`Reset ${week[di].day} to the default plan?`)) return;
    saveWeek(week.map((d, i) => (i === di ? JSON.parse(JSON.stringify(DEFAULT_WEEK[di])) : d)));
  };

  const selStyle = { ...inputStyle, minWidth: 0, padding: "8px 8px", fontSize: 13, WebkitAppearance: "none", appearance: "none" };

  return (
    <div className="tt-cols">
      {week.map((d, di) => {
        const editing = editDay === d.day;
        return (
          <Card key={d.day} style={{ marginBottom: 8, padding: 0, overflow: "hidden", borderWidth: d.day === today ? 2 : 0, borderStyle: "solid", borderColor: d.day === today ? "#C9922B" : "transparent" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button onClick={() => toggle(d.day)} style={{ flex: 1, padding: "14px 8px 14px 16px", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...font }}>
                <div style={{ textAlign: "left", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: PINE_T }}>{d.day}{d.day === today && <span style={{ fontSize: 11, color: TEAL, marginLeft: 8, letterSpacing: 1 }}>TODAY</span>}</div>
                  {editing ? (
                    <input value={d.focus} onClick={(e) => e.stopPropagation()} onChange={(e) => saveWeek(week.map((x, i) => i === di ? { ...x, focus: e.target.value } : x))}
                      style={{ ...inputStyle, minWidth: 0, padding: "5px 8px", fontSize: 13, marginTop: 3 }} />
                  ) : (
                    <div style={{ fontSize: 13, color: "var(--mut)" }}>{d.focus}</div>
                  )}
                </div>
                <span style={{ color: "var(--faint)", paddingLeft: 8 }}>{open[d.day] ? "▴" : "▾"}</span>
              </button>
              <button onClick={() => { setEditDay(editing ? null : d.day); setOpen({ ...open, [d.day]: true }); }}
                style={{ border: "none", background: editing ? TEAL : "transparent", color: editing ? "#fff" : TEAL, fontWeight: 700, fontSize: 12, borderRadius: 8, padding: "7px 12px", margin: "0 12px", cursor: "pointer", ...font }}>
                {editing ? "Done" : "Edit"}
              </button>
            </div>
            {open[d.day] && !editing && (
              <div style={{ padding: "0 16px 14px" }}>
                {d.items.map((it) => {
                  const extra = it.slot ? forSlot(it.slot) : "";
                  if (it.skipIfEmpty && !extra && !it.text) return null;
                  const body = [it.text, extra].filter(Boolean).join(" + ");
                  if (!body) return null;
                  const hot = it.text.match(/GYM|POOL|PILATES|PARK WALK|BATCH COOK/);
                  return (
                    <div key={it.id} style={{ padding: "7px 0", borderTop: "1px solid #EAE2D3", fontSize: 14, display: "flex", gap: 10 }}>
                      <span style={{ ...numFont, fontWeight: 700, color: "var(--faint)", minWidth: 44, flexShrink: 0 }}>{fmtTime(it.time)}</span>
                      <span style={{ color: hot ? TEAL : INK, fontWeight: hot ? 600 : 400 }}>{body}</span>
                    </div>
                  );
                })}
                {customs.map((s) => (
                  <div key={s.id} style={{ padding: "7px 0", borderTop: "1px solid #EAE2D3", fontSize: 14, display: "flex", gap: 10 }}>
                    <span style={{ minWidth: 44, flexShrink: 0 }} />
                    <span style={{ color: INK }}>{s.name}{s.note ? ` — ${s.note}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
            {open[d.day] && editing && (
              <div style={{ padding: "0 12px 14px" }}>
                {d.items.map((it, idx) => (
                  <div key={it.id} style={{ borderTop: "1px solid #EAE2D3", padding: "9px 0", display: "grid", gap: 6 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 6, alignItems: "center" }}>
                      <input type="time" value={it.time || ""} onChange={(e) => updateItem(di, it.id, { time: e.target.value })}
                        style={{ ...inputStyle, width: 96, minWidth: 0, padding: "8px 6px", fontSize: 13, WebkitAppearance: "none", appearance: "none" }} />
                      <input value={it.text} placeholder="What happens…" onChange={(e) => updateItem(di, it.id, { text: e.target.value })}
                        style={{ ...inputStyle, minWidth: 0, padding: "8px 8px", fontSize: 13 }} />
                      <div style={{ display: "flex", gap: 2 }}>
                        <button onClick={() => move(di, idx, -1)} style={{ border: "none", background: "none", color: "var(--faint)", cursor: "pointer", fontSize: 15, padding: 3 }}>↑</button>
                        <button onClick={() => move(di, idx, 1)} style={{ border: "none", background: "none", color: "var(--faint)", cursor: "pointer", fontSize: 15, padding: 3 }}>↓</button>
                        <button onClick={() => updateDay(di, d.items.filter((x) => x.id !== it.id))} style={{ border: "none", background: "none", color: "#B77", cursor: "pointer", fontSize: 15, padding: 3 }}>✕</button>
                      </div>
                    </div>
                    <select value={it.slot || ""} onChange={(e) => updateItem(di, it.id, { slot: e.target.value || undefined })} style={selStyle}>
                      <option value="">No supplements at this item</option>
                      <option value="breakfast">Breakfast supplements</option>
                      <option value="morning">Mid-morning supplements</option>
                      <option value="lunch">Lunch supplements</option>
                      <option value="afternoon">Mid-afternoon supplements</option>
                      <option value="dinner">Dinner supplements</option>
                    </select>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <Btn kind="teal" small style={{ flex: 1 }} onClick={() => updateDay(di, [...d.items, { id: "i" + Date.now(), time: "", text: "" }])}>+ Add item</Btn>
                  <Btn kind="danger" small onClick={() => resetDay(di)}>Reset day</Btn>
                </div>
              </div>
            )}
          </Card>
        );
      })}
      <div style={{ fontSize: 12, color: "var(--mut)", padding: "6px 4px" }}>{rhythm ? `Supplement rhythm: ${rhythm}.` : "No supplements set — add them in the Me tab."} Timed items sort themselves; untimed ones use the arrows.</div>
      <div style={{ padding: "4px" }}>
        <Btn kind="ghost" small onClick={() => { if (confirm("Reset the ENTIRE week to the default plan? Your customisations will be lost.")) saveWeek(JSON.parse(JSON.stringify(DEFAULT_WEEK))); }}>Reset entire week to default</Btn>
      </div>
    </div>
  );
}

// ---------- Meals ----------
function MacroChips({ r, size = 12 }) {
  return (
    <span style={{ fontSize: size, color: "var(--mut)", whiteSpace: "nowrap" }}>
      <b style={{ color: PINE_T }}>{r.p ?? "—"}P</b> · {r.c ?? "—"}C · {r.f ?? "—"}F
    </span>
  );
}

function Meals({ recipes, save, shopping = [], saveShopping, lunchEst = LUNCH_SNACKS_DEFAULT, macroT = MACRO_TARGETS, toast = () => {} }) {
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [rotation, setRotation] = useState({ b: null, d: null });
  const [newItem, setNewItem] = useState("");
  const recipeLines = (r) => r.ingredients.split("\n").map((l) => l.trim())
    .filter((l) => l && !PANTRY_RE.test(l) && !/to serve|pantry|at blend time/i.test(l));
  const addRecipes = (list) => {
    const have = new Set(shopping.map((it) => it.text.toLowerCase()));
    const fresh = [...new Set(list.filter(Boolean).flatMap(recipeLines))].filter((l) => !have.has(l.toLowerCase()));
    if (fresh.length) saveShopping([...shopping, ...fresh.map((t, i) => ({ id: "sh" + Date.now() + i, text: t, done: false }))]);
    return fresh.length;
  };
  const flash = (n) => toast(n ? `Added ${n} item${n > 1 ? "s" : ""}` : "Already on the list");
  useEffect(() => { (async () => setRotation(await sGet("rotation", { b: null, d: null })))(); }, []);
  const saveRotation = (v) => { setRotation(v); sSet("rotation", v); };

  const blank = { id: null, type: "dinner", name: "", cal: "", p: "", c: "", f: "", serves: "6 serves", ingredients: "", method: "" };
  const upsert = (r) => {
    const rec = { ...r, cal: parseInt(r.cal) || 0, p: parseInt(r.p) || 0, c: parseInt(r.c) || 0, f: parseInt(r.f) || 0, id: r.id || "r" + Date.now() };
    const next = r.id ? recipes.map((x) => (x.id === r.id ? rec : x)) : [...recipes, rec];
    save(next); setEditing(null);
  };

  const bPick = recipes.find((r) => r.id === rotation.b);
  const dPick = recipes.find((r) => r.id === rotation.d);
  const tot = (k) => (bPick?.[k] || 0) + (dPick?.[k] || 0) + (lunchEst[k] || 0);
  const MacroBar = ({ label, val, target }) => {
    const pct = Math.min(120, (val / target) * 100);
    const over = val > target * 1.08, under = val < target * 0.9;
    return (
      <div style={{ flex: 1, minWidth: 90 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: "var(--mut)", fontWeight: 600 }}>{label}</span>
          <span style={{ fontWeight: 700, color: over ? AMBER : under ? AMBER : GOOD }}>{val}g<span style={{ color: "var(--faint)", fontWeight: 400 }}>/{target}</span></span>
        </div>
        <div style={{ height: 7, background: "var(--line2)", borderRadius: 4, marginTop: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: over || under ? AMBER : GOOD, borderRadius: 4 }} />
        </div>
      </div>
    );
  };

  const picker = (type, val, key) => (
    <select value={val || ""} onChange={(e) => saveRotation({ ...rotation, [key]: e.target.value || null })}
      style={{ ...inputStyle, minWidth: 0, padding: "9px 10px", fontSize: 14, WebkitAppearance: "none", appearance: "none" }}>
      <option value="">— pick {type} —</option>
      {recipes.filter((r) => r.type === type).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
    </select>
  );

  const Section = ({ type, title }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--mut)", fontWeight: 700, margin: "4px 2px 8px" }}>{title}</div>
      {recipes.filter((r) => r.type === type).map((r) => (
        <Card key={r.id} style={{ marginBottom: 8, padding: 0, overflow: "hidden" }}>
          <button onClick={() => setOpenId(openId === r.id ? null : r.id)} style={{ width: "100%", padding: "13px 16px", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, cursor: "pointer", ...font }}>
            <div style={{ textAlign: "left", minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "var(--mut)" }}>{r.serves}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ ...numFont, fontSize: 19, fontWeight: 700, color: TEAL }}>{r.cal}<span style={{ fontSize: 11, color: "var(--faint)" }}> cal</span></div>
              <MacroChips r={r} size={11} />
            </div>
          </button>
          {openId === r.id && (
            <div style={{ padding: "0 16px 14px" }}>
              <div style={{ fontSize: 12, ...headFont, fontWeight: 800, color: PINE_T, letterSpacing: 1, marginBottom: 4 }}>PER SERVE</div>
              <div style={{ fontSize: 14, marginBottom: 10 }}>{r.cal} cal · <MacroChips r={r} size={14} /></div>
              <div style={{ fontSize: 12, ...headFont, fontWeight: 800, color: PINE_T, letterSpacing: 1, marginBottom: 4 }}>INGREDIENTS</div>
              <div style={{ fontSize: 14, whiteSpace: "pre-line", marginBottom: 10, color: INK }}>{r.ingredients}</div>
              <div style={{ fontSize: 12, ...headFont, fontWeight: 800, color: PINE_T, letterSpacing: 1, marginBottom: 4 }}>METHOD</div>
              <div style={{ fontSize: 14, whiteSpace: "pre-line", marginBottom: 12, color: INK }}>{r.method}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn kind="teal" small onClick={() => flash(addRecipes([r]))}>🛒 + List</Btn>
                <Btn kind="ghost" small onClick={() => setEditing(r)}>Edit</Btn>
                <Btn kind="danger" small onClick={() => save(recipes.filter((x) => x.id !== r.id))}>Remove</Btn>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );

  if (editing) {
    const r = editing === "new" ? blank : editing;
    return <RecipeForm initial={r} onSave={upsert} onCancel={() => setEditing(null)} />;
  }

  return (
    <div className="tt-cols">
      <Card style={{ marginBottom: 14, borderLeftWidth: 4, borderLeftStyle: "solid", borderLeftColor: "#2F4A3E" }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 8, fontSize: 16 }}>This week's rotation — day macro check</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          <div style={{ minWidth: 0 }}>{picker("breakfast", rotation.b, "b")}</div>
          <div style={{ minWidth: 0 }}>{picker("dinner", rotation.d, "d")}</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MacroBar label="Protein" val={tot("p")} target={macroT.p} />
          <MacroBar label="Carbs" val={tot("c")} target={macroT.c} />
          <MacroBar label="Fat" val={tot("f")} target={macroT.f} />
          {(() => {
            const dayCal = tot("p") * 4 + tot("c") * 4 + tot("f") * 9;
            const over = macroT.target && dayCal > macroT.target * 1.05;
            return (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(120,106,84,0.22)", fontSize: 13 }}>
                <span style={{ color: "var(--mut)", fontWeight: 600 }}>Estimated day</span>
                <span style={{ fontWeight: 800, color: over ? "#B23B2E" : "#4C8767" }}>&#8776;{dayCal} cal{macroT.target ? ` / ${macroT.target} target` : ""}</span>
              </div>
            );
          })()}
        </div>
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8 }}>Includes your lunch/snack estimate: {lunchEst.p}P / {lunchEst.c}C / {lunchEst.f}F (edit in Me). Targets: {macroT.p}P / {macroT.c}C / {macroT.f}F{macroT.auto ? " — auto-derived from your calorie target and latest weight" : " — add your details in Me for personalised targets"}.</div>
        <div style={{ marginTop: 10 }}>
          <Btn kind="teal" small onClick={() => flash(addRecipes([bPick, dPick]))}>🛒 Add both to shopping list</Btn>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T, fontSize: 16 }}>Shopping list{shopping.length ? ` · ${shopping.filter((i) => !i.done).length} to get` : ""}</div>
        </div>
        {shopping.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--mut)" }}>Empty — add a recipe's ingredients with the 🛒 buttons, or type items below. Tap an item to tick it off; ✕ removes things you already have.</div>
        ) : (
          <>
            {shopping.map((it) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 9, borderTop: "1px solid rgba(120,106,84,0.22)", padding: "6px 0" }}>
                <button onClick={() => saveShopping(shopping.map((x) => x.id === it.id ? { ...x, done: !x.done } : x))} style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, ...font }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, borderWidth: 2, borderStyle: "solid", borderColor: it.done ? "#4C8767" : "#A69C8C", background: it.done ? "#4C8767" : "transparent", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.done ? "✓" : ""}</span>
                  <span style={{ fontSize: 14, color: it.done ? "var(--faint)" : INK, textDecoration: it.done ? "line-through" : "none" }}>{it.text}</span>
                </button>
                <button onClick={() => saveShopping(shopping.filter((x) => x.id !== it.id))} style={{ border: "none", background: "none", color: "#B77", cursor: "pointer", fontSize: 15, flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Btn kind="ghost" small onClick={async () => {
                const text = shopping.filter((i) => !i.done).map((i) => i.text).join("\n");
                try { await navigator.clipboard.writeText(text); setMsg("Copied — paste into any list app"); }
                catch { setMsg("Couldn't copy on this device"); }
              }}>Copy list</Btn>
              {/iPad|iPhone|iPod/.test(typeof navigator !== "undefined" ? navigator.userAgent : "") && (
                <Btn kind="ghost" small onClick={() => {
                  const text = shopping.filter((i) => !i.done).map((i) => i.text).join("\n");
                  window.location.href = "shortcuts://run-shortcut?name=" + encodeURIComponent("Trend Shopping") + "&input=text&text=" + encodeURIComponent(text);
                }}>→ Reminders</Btn>
              )}
              {shopping.some((i) => i.done) && <Btn kind="ghost" small onClick={() => saveShopping(shopping.filter((i) => !i.done))}>Clear ticked</Btn>}
              <ConfirmBtn onConfirm={() => { saveShopping([]); toast("List cleared"); }}>Clear all</ConfirmBtn>
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input placeholder="Add your own item…" value={newItem} onChange={(e) => setNewItem(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0, fontSize: 14 }} />
          <Btn kind="teal" small onClick={() => { if (newItem.trim()) { saveShopping([...shopping, { id: "sh" + Date.now(), text: newItem.trim(), done: false }]); setNewItem(""); } }}>Add</Btn>
        </div>
      </Card>

      <Btn kind="teal" onClick={() => setEditing("new")} style={{ width: "100%", marginBottom: 14 }}>+ Add a recipe</Btn>
      <Section type="breakfast" title="Breakfasts" />
      <Section type="dinner" title="Dinners" />
      <div style={{ fontSize: 12, color: "var(--mut)", padding: "0 4px" }}>All batches keep 3 days refrigerated. Cook nights: Sunday (covers Mon–Wed) and Thursday (covers Thu–Sun). Lunch idea: bake the schnitzel rather than fry, go easy on the mayo; on sushi days add extra chicken or a boiled egg.</div>
    </div>
  );
}

function RecipeForm({ initial, onSave, onCancel }) {
  const [r, setR] = useState(initial);
  const set = (k) => (e) => setR({ ...r, [k]: e.target.value });
  return (
    <Card>
      <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 12, fontSize: 17 }}>{initial.id ? "Edit recipe" : "New recipe"}</div>
      <div style={{ display: "grid", gap: 10 }}>
        <input placeholder="Recipe name" value={r.name} onChange={set("name")} style={inputStyle} />
        <div style={{ display: "flex", gap: 10 }}>
          <select value={r.type} onChange={set("type")} style={{ ...inputStyle, flex: 1, minWidth: 0, WebkitAppearance: "none", appearance: "none" }}>
            <option value="breakfast">Breakfast</option>
            <option value="dinner">Dinner</option>
          </select>
          <input type="number" placeholder="Cal/serve" value={r.cal} onChange={set("cal")} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600 }}>PROTEIN G</div><input type="number" value={r.p} onChange={set("p")} style={{ ...inputStyle, minWidth: 0 }} /></div>
          <div><div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600 }}>CARBS G</div><input type="number" value={r.c} onChange={set("c")} style={{ ...inputStyle, minWidth: 0 }} /></div>
          <div><div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600 }}>FAT G</div><input type="number" value={r.f} onChange={set("f")} style={{ ...inputStyle, minWidth: 0 }} /></div>
        </div>
        <input placeholder="Serves (e.g. 6 serves)" value={r.serves} onChange={set("serves")} style={inputStyle} />
        <textarea placeholder="Ingredients — one per line" rows={6} value={r.ingredients} onChange={set("ingredients")} style={{ ...inputStyle, resize: "vertical" }} />
        <textarea placeholder="Method — one step per line" rows={6} value={r.method} onChange={set("method")} style={{ ...inputStyle, resize: "vertical" }} />
        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={() => r.name.trim() && onSave(r)} style={{ flex: 1 }}>Save recipe</Btn>
          <Btn kind="ghost" onClick={onCancel}>Cancel</Btn>
        </div>
      </div>
    </Card>
  );
}

// ---------- Profile ----------
function calcAge(dob) {
  if (!dob) return null;
  const b = new Date(dob), n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

function calcEnergy(profile, entries) {
  const age = calcAge(profile.dob);
  const hCm = parseFloat(profile.heightCm) || 178;
  const latest = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];
  const w = latest?.weight || parseFloat(profile.startWeight) || null;
  if (!w || age == null) return { bmr: null, lose: null, maintain: null, gain: null, target: null, mode: profile.calMode || "lose" };
  const bmr = 10 * w + 6.25 * hCm - 5 * age + (profile.sex === "female" ? -161 : 5);
  const tdee = bmr * 1.55;
  const opts = { lose: Math.round(tdee - 500), maintain: Math.round(tdee), gain: Math.round(tdee + 300) };
  const mode = profile.calMode || "lose";
  const target = mode === "custom" ? (parseInt(profile.customCal) || null) : opts[mode];
  return { bmr: Math.round(bmr), ...opts, target, mode };
}

function Profile({ profile, saveProfile, goal, setGoal, entries, photos, savePhotos, supps, saveSupps, theme, setTheme, colorTheme, setColorTheme, tabsEnabled, saveTabsEnabled, holidays = [], saveHolidays, water = {}, glp = {}, workouts = [] }) {
  const holidayActive = holidays.some((h) => !h.e);
  const set = (k) => (e) => saveProfile({ ...profile, [k]: e.target.value });
  const age = calcAge(profile.dob);
  const hM = (parseFloat(profile.heightCm) || 178) / 100;
  const latest = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-1)[0];
  const w = latest?.weight || parseFloat(profile.startWeight) || null;

  const energy = calcEnergy(profile, entries);
  const healthyLow = (18.5 * hM * hM).toFixed(0);
  const healthyHigh = (24.9 * hM * hM).toFixed(0);
  const belowBmr = energy.mode === "custom" && energy.target && energy.bmr && energy.target < energy.bmr;

  const CalOption = ({ mode, label, val, note }) => {
    const active = energy.mode === mode;
    return (
      <button onClick={() => saveProfile({ ...profile, calMode: mode })} style={{
        flex: 1, padding: "12px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", ...font,
        borderWidth: active ? 2.5 : 1.5, borderStyle: "solid", borderColor: active ? "#C9922B" : "#DCD2BC",
        background: active ? "var(--teal-soft)" : "var(--surface)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: active ? TEAL : "var(--mut)", textTransform: "uppercase" }}>{label}</div>
        <div style={{ ...numFont, fontSize: 24, fontWeight: 700, color: INK }}>{val ?? "—"}</div>
        <div style={{ fontSize: 10, color: "var(--faint)" }}>{note}</div>
      </button>
    );
  };

  // ---- photo check-ins ----
  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
        const id = "p" + Date.now();
        try {
          await Preferences.set({ key: "tt:photo:" + id, value: dataUrl });
          const next = [...photos, { id, date: todayISO(), weight: latest?.weight || null }];
          savePhotos(next);
        } catch (err) { console.error("Photo save failed", err); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const removePhoto = async (id) => {
    await sDel("photo:" + id);
    savePhotos(photos.filter((p) => p.id !== id));
  };

  return (
    <div>
      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 12, fontSize: 17 }}>My details</div>
        <div style={{ display: "grid", gap: 10 }}>
          <input placeholder="Name" value={profile.name || ""} onChange={set("name")} style={inputStyle} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600, whiteSpace: "nowrap" }}>DATE OF BIRTH</div>
            <DobPicker value={profile.dob || ""} onChange={(v) => saveProfile({ ...profile, dob: v })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600 }}>SEX</div>
              <select value={profile.sex || "male"} onChange={set("sex")} style={{ ...inputStyle, minHeight: 48, minWidth: 0, WebkitAppearance: "none", appearance: "none", backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%236B7C74%22 stroke-width=%222%22 fill=%22none%22/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32 }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600, whiteSpace: "nowrap" }}>HEIGHT CM</div>
              <input type="number" inputMode="decimal" value={profile.heightCm || ""} onChange={set("heightCm")} style={{ ...inputStyle, minHeight: 48 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600, whiteSpace: "nowrap" }}>START KG</div>
              <input type="number" inputMode="decimal" value={profile.startWeight || ""} onChange={set("startWeight")} style={{ ...inputStyle, minHeight: 48 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600, whiteSpace: "nowrap" }}>GOAL KG</div>
              <input type="number" inputMode="decimal" value={goal} onChange={(e) => setGoal(parseFloat(e.target.value) || goal)} style={{ ...inputStyle, minHeight: 48 }} />
            </div>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 10, fontSize: 17 }}>Your numbers</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 14 }}>
          <div><span style={{ color: "var(--mut)" }}>Age</span><div style={{ ...numFont, fontSize: 26, fontWeight: 700 }}>{age ?? "—"}</div></div>
          <div><span style={{ color: "var(--mut)" }}>Healthy weight range</span><div style={{ ...numFont, fontSize: 26, fontWeight: 700 }}>{healthyLow}–{healthyHigh}<span style={{ fontSize: 14, color: "var(--faint)" }}> kg</span></div></div>
          <div><span style={{ color: "var(--mut)" }}>BMR (burn at rest)</span><div style={{ ...numFont, fontSize: 26, fontWeight: 700 }}>{energy.bmr ?? "—"}<span style={{ fontSize: 14, color: "var(--faint)" }}> cal</span></div></div>
          <div><span style={{ color: "var(--mut)" }}>Maintenance (with training)</span><div style={{ ...numFont, fontSize: 26, fontWeight: 700, color: TEAL }}>{energy.maintain ?? "—"}<span style={{ fontSize: 14, color: "var(--faint)" }}> cal</span></div></div>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 4, fontSize: 17 }}>Calorie target</div>
        <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 12 }}>Tap a preset or set your own. This shows on your dashboard and recalculates as your weight changes.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <CalOption mode="lose" label="Lose" val={energy.lose} note="−500 · ~0.5 kg/wk" />
          <CalOption mode="maintain" label="Maintain" val={energy.maintain} note="hold steady" />
          <CalOption mode="gain" label="Gain" val={energy.gain} note="+300 · build" />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => saveProfile({ ...profile, calMode: "custom" })} style={{
            padding: "12px 14px", borderRadius: 12, cursor: "pointer", ...font, fontWeight: 700, fontSize: 12, letterSpacing: 1, textTransform: "uppercase",
            borderWidth: energy.mode === "custom" ? 2.5 : 1.5, borderStyle: "solid", borderColor: energy.mode === "custom" ? "#C9922B" : "#DCD2BC",
            background: energy.mode === "custom" ? "var(--teal-soft)" : "var(--surface)",
            color: energy.mode === "custom" ? TEAL : "var(--mut)",
          }}>Custom</button>
          <input type="number" inputMode="numeric" placeholder="e.g. 1900" value={profile.customCal || ""}
            onChange={(e) => saveProfile({ ...profile, customCal: e.target.value, calMode: "custom" })}
            style={{ ...inputStyle, flex: 1 }} />
          <span style={{ fontSize: 13, color: "var(--mut)" }}>cal/day</span>
        </div>
        {belowBmr && (
          <div style={{ marginTop: 10, background: "var(--warn-bg)", border: "1.5px solid #E5B876", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--warn-t)" }}>
            ⚠ That's below your BMR ({energy.bmr} cal) — the energy your body uses at complete rest. Eating under it long-term tends to burn muscle, stall metabolism and end diets. Consider {energy.lose} cal instead, or check with your GP.
          </div>
        )}
        {energy.target && !belowBmr && (
          <div style={{ marginTop: 10, fontSize: 14, color: INK }}>
            Active target: <b style={{ color: GOOD }}>{energy.target} cal/day</b>
            {energy.mode === "lose" && " — roughly 0.5 kg/week of loss."}
            {energy.mode === "maintain" && " — holding your current weight."}
            {energy.mode === "gain" && " — a lean surplus for building."}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 4, fontSize: 17 }}>Tabs & features</div>
        <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 6 }}>Turn off what you don't use — Today and Me always stay. Hidden tabs keep their data.</div>
        {[["dash", "Trends", "Charts, weekly review, milestones"], ["log", "Daily Log", "Weigh-ins and the gym logger"], ["habits", "Habits", "Weekly habit grid"], ["week", "Schedule", "Editable weekly plan"], ["meals", "Meals", "Recipes and shopping list"]].map(([id, name, desc]) => (
          <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, borderTop: "1px solid rgba(120,106,84,0.22)", padding: "9px 0" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
              <div style={{ fontSize: 12, color: "var(--mut)" }}>{desc}</div>
            </div>
            <Toggle on={tabsEnabled[id] !== false} onTap={() => saveTabsEnabled({ ...tabsEnabled, [id]: !(tabsEnabled[id] !== false) })} />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, borderTop: "1px solid rgba(120,106,84,0.22)", padding: "9px 0" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>GLP-1 symptom tracker</div>
            <div style={{ fontSize: 12, color: "var(--mut)" }}>Medication side effects and injection days (off by default)</div>
          </div>
          <Toggle on={!!profile.glpEnabled} onTap={() => saveProfile({ ...profile, glpEnabled: !profile.glpEnabled })} />
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ ...headFont, fontWeight: 800, color: PINE_T, fontSize: 17 }}>Holiday / deload mode</div>
            <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 2 }}>Pauses your streak and softens the weekly verdict — no guilt while travelling or taking a planned break. Logging still works if you want to.</div>
          </div>
          <Toggle on={holidayActive} onTap={() => {
            const now = todayISO();
            if (holidayActive) {
              saveHolidays(holidays.map((h) => h.e ? h : { ...h, e: now }));
            } else {
              saveHolidays([...holidays, { s: now, e: null }]);
            }
          }} />
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T, fontSize: 17 }}>Supplements</div>
          <Btn kind="teal" small onClick={() => saveSupps([...supps, { id: "s" + Date.now(), name: "", slot: "breakfast", note: "" }])}>+ Add</Btn>
        </div>
        <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 12 }}>These flow through the whole weekly schedule automatically. Check changes with your GP or pharmacist — the app tracks timing, it doesn't give medical advice.</div>
        {supps.length === 0 && <div style={{ color: "var(--mut)", fontSize: 14 }}>No supplements — add one above if you take any.</div>}
        {supps.map((s) => (
          <div key={s.id} style={{ borderTop: "1px solid #EAE2D3", padding: "10px 0", display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr auto", gap: 8, alignItems: "center" }}>
              <input placeholder="Name" value={s.name} onChange={(e) => saveSupps(supps.map((x) => x.id === s.id ? { ...x, name: e.target.value } : x))} style={{ ...inputStyle, minWidth: 0, padding: "9px 10px", fontSize: 14 }} />
              <select value={s.slot} onChange={(e) => saveSupps(supps.map((x) => x.id === s.id ? { ...x, slot: e.target.value } : x))} style={{ ...inputStyle, minWidth: 0, padding: "9px 10px", fontSize: 14, WebkitAppearance: "none", appearance: "none" }}>
                <option value="breakfast">Breakfast</option>
                <option value="morning">Mid-morning</option>
                <option value="lunch">Lunch</option>
                <option value="afternoon">Mid-afternoon</option>
                <option value="dinner">Dinner</option>
                <option value="custom">Custom</option>
              </select>
              <ConfirmBtn confirmLabel="Confirm?" onConfirm={() => saveSupps(supps.filter((x) => x.id !== s.id))} style={{ padding: "3px 10px", fontSize: 11 }}>✕</ConfirmBtn>
            </div>
            <input placeholder="Note (e.g. take with food, 2 hrs clear of the multi)" value={s.note || ""} onChange={(e) => saveSupps(supps.map((x) => x.id === s.id ? { ...x, note: e.target.value } : x))} style={{ ...inputStyle, minWidth: 0, padding: "8px 10px", fontSize: 13, color: "var(--mut)" }} />
          </div>
        ))}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 4, fontSize: 17 }}>Lunch & snack estimate</div>
        <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 10 }}>Used in the Meals macro check to account for meals you don't batch-cook. Set to your typical lunch + snacks, or zero them out if you'd rather only count batches.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[["p", "PROTEIN g"], ["c", "CARBS g"], ["f", "FAT g"]].map(([k, lab]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600 }}>{lab}</div>
              <input type="number" inputMode="numeric" value={(profile.lunchMacros || LUNCH_SNACKS_DEFAULT)[k]} onChange={(e) => saveProfile({ ...profile, lunchMacros: { ...(profile.lunchMacros || LUNCH_SNACKS_DEFAULT), label: "Lunch + snacks", [k]: parseInt(e.target.value) || 0 } })} style={{ ...inputStyle, minWidth: 0 }} />
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 4, fontSize: 17 }}>Macro targets</div>
        <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 10 }}>Auto-derived and kept in sync: protein 2g per kg of your latest weight, fat 27% of your calorie target, carbs the remainder. They shift as your weight and calorie mode change. Type a number to pin one manually; clear it to go back to auto.</div>
        {(() => {
          const autoT = calcMacros({ ...profile, macroOverride: {} }, entries);
          const ov = profile.macroOverride || {};
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[["p", "PROTEIN g"], ["c", "CARBS g"], ["f", "FAT g"]].map(([k, lab]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 3, fontWeight: 600 }}>{lab}</div>
                  <input type="number" inputMode="numeric" placeholder={"auto " + autoT[k]} value={ov[k] || ""}
                    onChange={(e) => saveProfile({ ...profile, macroOverride: { ...ov, [k]: parseInt(e.target.value) || 0 } })}
                    style={{ ...inputStyle, minWidth: 0 }} />
                </div>
              ))}
            </div>
          );
        })()}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 8, fontSize: 17 }}>Appearance</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["light", "Light"], ["dark", "Dark"], ["auto", "Auto"]].map(([val, label]) => (
            <button key={val} onClick={() => setTheme(val)} style={{
              flex: 1, padding: "11px 8px", borderRadius: 12, cursor: "pointer", ...font, fontWeight: 700, fontSize: 13,
              borderWidth: theme === val ? 2.5 : 1.5, borderStyle: "solid", borderColor: theme === val ? "#C9922B" : "rgba(120,106,84,0.35)",
              background: theme === val ? "var(--teal-soft)" : "var(--surface2)",
              color: theme === val ? TEAL : "var(--mut)",
            }}>{label}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "var(--faint)", marginTop: 8 }}>Auto follows your device's light/dark setting.</div>
        <div style={{ fontSize: 12, color: "var(--mut)", fontWeight: 600, margin: "14px 0 8px" }}>COLOUR THEME</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {COLOR_THEMES.map((t) => (
            <button key={t.id} onClick={() => setColorTheme(t.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer",
              background: "none", border: "none", ...font, padding: 2,
            }}>
              <span style={{
                width: 44, height: 44, borderRadius: "50%", boxSizing: "border-box",
                background: t.primary, position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                borderWidth: 3, borderStyle: "solid", borderColor: colorTheme === t.id ? t.accL : "transparent",
                outline: colorTheme === t.id ? "2px solid rgba(120,106,84,0.35)" : "none", outlineOffset: 2,
              }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: t.accL }} />
              </span>
              <span style={{ fontSize: 10, color: colorTheme === t.id ? "var(--ink)" : "var(--faint)", fontWeight: colorTheme === t.id ? 700 : 500 }}>{t.name}</span>
            </button>
          ))}
        </div>

      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T, fontSize: 17 }}>Photo check-ins</div>
          <label style={{ background: TEAL, color: "var(--surface)", borderRadius: 10, padding: "8px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            + Add photo
            <input type="file" accept="image/*" onChange={addPhoto} style={{ display: "none" }} />
          </label>
        </div>
        {photos.length >= 2 && <BeforeAfter photos={photos} />}
        {photos.length === 0 ? (
          <div style={{ color: "var(--mut)", fontSize: 14, padding: "10px 0" }}>Take a front-on photo in the same spot, same lighting, once a month. The mirror lies day to day — photos three months apart don't.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginTop: 10 }}>
            {[...photos].sort((a, b) => b.date.localeCompare(a.date)).map((p) => (
              <PhotoThumb key={p.id} photo={p} onRemove={() => removePhoto(p.id)} />
            ))}
          </div>
        )}
      </Card>
      <Card style={{ marginTop: 14 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 6, fontSize: 17 }}>Backup</div>
        <div style={{ fontSize: 13, color: "var(--mut)", marginBottom: 12 }}>Your data lives on this device. Export a backup file occasionally, and import it to restore or move to a new device.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn kind="ghost" style={{ flex: 1 }} onClick={async () => {
            const dump = {};
            const { keys } = await Preferences.keys();
            for (const k of keys) {
              if (k.startsWith("tt:")) { const { value } = await Preferences.get({ key: k }); dump[k] = value; }
            }
            const blob = new Blob([JSON.stringify(dump)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "training-table-backup-" + todayISO() + ".json";
            a.click();
          }}>Export backup</Btn>
          <label style={{ flex: 1, textAlign: "center", padding: "12px 18px", borderRadius: 999, background: "var(--surface)", borderWidth: 1.5, borderStyle: "solid", borderColor: "rgba(120,106,84,0.35)", color: INK, fontWeight: 800, fontSize: 15, cursor: "pointer", ...font }}>
            Import backup
            <input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => {
                try {
                  const dump = JSON.parse(r.result);
                  (async () => {
                    for (const [k, v] of Object.entries(dump)) { if (k.startsWith("tt:")) await Preferences.set({ key: k, value: v }); }
                    window.location.reload();
                  })();
                } catch { alert("That doesn't look like a valid backup file."); }
              };
              r.readAsText(f);
            }} />
          </label>
        </div>
        <CsvExport csv={() => buildCsv(entries, water, glp, workouts, (parseFloat(profile.heightCm) || 178) / 100)} />
        <ResetControls
          resetContent={async () => { await sSet("recipes", DEFAULT_RECIPES); await sSet("week", DEFAULT_WEEK); await sSet("supplements", DEFAULT_SUPPS); await sSet("recipesVersion", 2); window.location.reload(); }}
          eraseAll={async () => { const { keys } = await Preferences.keys(); for (const k of keys) { if (k.startsWith("tt:")) await Preferences.remove({ key: k }); } window.location.reload(); }}
        />
      </Card>
    </div>
  );
}

function usePhotoSrc(id) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { value } = await Preferences.get({ key: "tt:photo:" + id });
        if (live && value) setSrc(value);
      } catch {}
    })();
    return () => { live = false; };
  }, [id]);
  return src;
}

function PhotoThumb({ photo, onRemove }) {
  const src = usePhotoSrc(photo.id);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", background: "var(--line2)" }}>
        {src && <img src={src} alt="check-in" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      <div style={{ fontSize: 11, color: "var(--mut)", marginTop: 3, display: "flex", justifyContent: "space-between" }}>
        <span>{fmtDay(photo.date)}{photo.weight ? ` · ${photo.weight}kg` : ""}</span>
        <button onClick={onRemove} style={{ border: "none", background: "none", color: "#B77", cursor: "pointer", padding: 0 }}>✕</button>
      </div>
    </div>
  );
}

function BeforeAfter({ photos }) {
  const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0], last = sorted[sorted.length - 1];
  const s1 = usePhotoSrc(first.id), s2 = usePhotoSrc(last.id);
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
      {[["BEFORE", first, s1], ["NOW", last, s2]].map(([label, p, src]) => (
        <div key={label} style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: label === "NOW" ? TEAL : "var(--faint)", marginBottom: 4 }}>{label}</div>
          <div style={{ width: "100%", aspectRatio: "3/4", borderRadius: 12, overflow: "hidden", background: "var(--line2)" }}>
            {src && <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 3 }}>{fmtDay(p.date)}{p.weight ? ` · ${p.weight}kg` : ""}</div>
        </div>
      ))}
    </div>
  );
}


// ---------- GLP-1 tracker (optional) ----------
const GLP_SE = ["Nausea", "Constipation", "Fatigue", "Heartburn"];
const GLP_SITES = [
  { id: "abdomen", label: "Abdomen" },
  { id: "l-thigh", label: "Left thigh" },
  { id: "r-thigh", label: "Right thigh" },
  { id: "l-arm", label: "Left arm" },
  { id: "r-arm", label: "Right arm" },
];
const GLP_DOSES = ["0.25mg", "0.5mg", "1.0mg", "1.7mg", "2.4mg", "2.5mg", "5mg", "7.5mg", "10mg", "12.5mg", "15mg"];

function daysSinceDose(glp, dateISO) {
  const inj = Object.entries(glp).filter(([, v]) => v.injection).map(([k]) => k).filter((k) => k <= dateISO).sort();
  if (!inj.length) return null;
  return Math.round((new Date(dateISO) - new Date(inj[inj.length - 1])) / 86400000);
}

function TapScale({ value = 0, max = 10, onChange, accent = "#C9922B", size = 27 }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {Array.from({ length: max }).map((_, i) => {
        const v = i + 1, on = (value || 0) >= v;
        return (
          <button key={v} onClick={() => onChange(value === v ? 0 : v)} style={{
            width: size, height: size, borderRadius: "50%", cursor: "pointer", padding: 0, ...font,
            borderWidth: 2, borderStyle: "solid",
            borderColor: on ? accent : "#A69C8C",
            background: on ? accent : "rgba(166,156,140,0.15)",
            color: on ? "#fff" : "#A69C8C", fontSize: 11, fontWeight: 700,
          }}>{v === value ? v : ""}</button>
        );
      })}
    </div>
  );
}


function GlpTrends({ glp = {}, accent = "#C9922B", dark = false }) {
  const [metric, setMetric] = useState("noise");
  const [range, setRange] = useState(30);
  const METRICS = [
    { id: "noise", label: "Food noise", max: 10 },
    { id: "mood", label: "Mood", max: 10 },
    { id: "load", label: "Side effects", max: 20 },
    { id: "fibre", label: "Fibre g", max: null },
  ];
  const dayMs = 86400000;
  const cGrid = dark ? "#332B21" : "#E2D9C8";
  const cTick = dark ? "#C9BEAE" : "#6B6055";
  const data = Array.from({ length: range }).map((_, i) => {
    const d = new Date(Date.now() - (range - 1 - i) * dayMs).toISOString().slice(0, 10);
    const e = glp[d];
    let v = null;
    if (e) {
      if (metric === "noise") v = e.foodNoise || null;
      else if (metric === "mood") v = e.mood || null;
      else if (metric === "fibre") v = e.fibre ?? null;
      else v = Object.keys(e.symptoms || {}).length ? Object.values(e.symptoms || {}).reduce((a, b) => a + (b || 0), 0) : null;
    }
    return { d, label: new Date(d + "T12:00").getDate(), v, inj: e?.injection };
  });
  const injDates = data.filter((x) => x.inj).map((x) => x.label);
  const hasData = data.filter((x) => x.v != null).length >= 2;
  const m = METRICS.find((x) => x.id === metric);
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T }}>Trend by day</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[30, 60, 90].map((r) => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11.5, fontWeight: 700, ...font,
              borderWidth: 1.5, borderStyle: "solid",
              borderColor: range === r ? accent : "#A69C8C66",
              background: range === r ? accent : "transparent",
              color: range === r ? "#fff" : "#A69C8C",
            }}>{r}d</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {METRICS.map((x) => (
          <button key={x.id} onClick={() => setMetric(x.id)} style={{
            padding: "7px 12px", borderRadius: 16, cursor: "pointer", fontSize: 12.5, fontWeight: 700, ...font,
            borderWidth: 1.5, borderStyle: "solid",
            borderColor: metric === x.id ? accent : "#A69C8C66",
            background: metric === x.id ? accent : "transparent",
            color: metric === x.id ? "#fff" : "#A69C8C",
          }}>{x.label}</button>
        ))}
      </div>
      {!hasData ? (
        <div style={{ fontSize: 13, color: "var(--mut)" }}>Log {m.label.toLowerCase()} on a few days and the daily trend appears here — injection days show as dashed lines.</div>
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={data} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid stroke={cGrid} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: cTick }} interval="preserveStartEnd" />
            <YAxis domain={[0, m.max || "auto"]} tick={{ fontSize: 11, fill: cTick }} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid rgba(120,106,84,0.22)", borderRadius: 8, color: "var(--ink)" }} labelStyle={{ color: "var(--ink)" }} labelFormatter={(l) => "Day " + l} />
            {data.filter((x) => x.inj).map((x) => (
              <ReferenceLine key={x.d} x={x.label} stroke="#B23B2E" strokeDasharray="4 3" strokeWidth={1.5} />
            ))}
            <Line type="monotone" dataKey="v" name={m.label} stroke={accent} strokeWidth={1.75} dot={{ r: 2.5, fill: accent }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>Dashed red lines = dose days. Read this alongside the "days since dose" chart in Trends: this shows whether things improve over calendar weeks; that one shows the within-cycle rhythm.</div>
    </Card>
  );
}

function Glp({ glp = {}, saveGlp, accent = "#C9922B", water = {}, saveWater, settings = {}, saveSettings, dark = false }) {
  const t = todayISO();
  const day = glp[t] || {};
  const setDay = (patch) => saveGlp({ ...glp, [t]: { ...day, ...patch } });
  const [mealTime, setMealTime] = useState(() => { const n = new Date(); return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`; });
  const [mealEnergy, setMealEnergy] = useState(0);

  const sinceInj = daysSinceDose(glp, t);
  const injHistory = Object.entries(glp).filter(([, v]) => v.injection).sort((a, b) => b[0].localeCompare(a[0]));
  const lastSite = injHistory.find(([, v]) => v.site)?.[1]?.site;
  const lastIdx = GLP_SITES.findIndex((s) => s.id === lastSite);
  const nextSite = GLP_SITES[(lastIdx + 1) % GLP_SITES.length].id;

  const logDose = () => setDay({ injection: true, med: { name: settings.name || "", dose: settings.dose || "" }, site: day.site || nextSite });
  const seSum = (e) => GLP_SE.reduce((a, s) => a + ((e?.symptoms || {})[s] || 0), 0) + Object.entries(e?.symptoms || {}).filter(([k]) => !GLP_SE.includes(k)).reduce((a, [, v]) => a + (v || 0), 0);

  const dayMs = 86400000;
  const days14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(Date.now() - (13 - i) * dayMs).toISOString().slice(0, 10);
    const e = glp[d];
    return { d, burden: e ? seSum(e) : 0, inj: e?.injection };
  });
  const maxB = Math.max(4, ...days14.map((x) => x.burden));
  const cups = water[t] || 0;
  const setCups = (n) => saveWater({ ...water, [t]: n });
  const sectionTitle = (txt) => <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 10 }}>{txt}</div>;

  return (
    <div className="tt-cols">
      {/* Dose logger */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          <div style={{ ...headFont, fontWeight: 800, color: PINE_T, fontSize: 16 }}>Medication</div>
          {sinceInj != null && <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>Day {sinceInj} since last dose</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 8, marginBottom: 10 }}>
          <input placeholder="Medication (e.g. Wegovy)" value={settings.name || ""} onChange={(e) => saveSettings({ ...settings, name: e.target.value })} style={{ ...inputStyle, minWidth: 0, fontSize: 14 }} />
          <select value={settings.dose || ""} onChange={(e) => saveSettings({ ...settings, dose: e.target.value })} style={{ ...inputStyle, minWidth: 0, fontSize: 14, WebkitAppearance: "none", appearance: "none" }}>
            <option value="">Dose…</option>
            {GLP_DOSES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {!day.injection ? (
          <Btn kind="teal" onClick={logDose} style={{ width: "100%" }}>💉 Log dose today{settings.dose ? ` — ${settings.dose}` : ""}</Btn>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#4C8767" }}>✓ Dose logged today{day.med?.dose ? ` · ${day.med.dose}` : ""}</span>
            <Btn kind="danger" small onClick={() => setDay({ injection: false, med: null, site: null })}>Undo</Btn>
          </div>
        )}
        {/* Injection site selector */}
        <div style={{ fontSize: 12, color: "var(--mut)", fontWeight: 600, margin: "12px 0 6px" }}>INJECTION SITE — rotate to prevent lumps (lipohypertrophy)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[["l-arm", "1 / 2"], ["abdomen", "2 / 3"], ["r-arm", "3 / 4"], ["l-thigh", "1 / 2"], ["", ""], ["r-thigh", "3 / 4"]].map(([id, col], idx) => {
            if (!id) return <span key={idx} />;
            const s = GLP_SITES.find((x) => x.id === id);
            const isLast = lastSite === id, isNext = nextSite === id && !day.injection, sel = day.site === id;
            return (
              <button key={id} onClick={() => setDay({ site: sel ? null : id })} style={{
                gridColumn: col, padding: "10px 4px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, ...font,
                borderWidth: 2, borderStyle: sel ? "solid" : isLast ? "dashed" : "solid",
                borderColor: sel ? accent : isLast ? "#B23B2E" : isNext ? "#4C8767" : "#A69C8C",
                background: sel ? accent : "rgba(166,156,140,0.1)",
                color: sel ? "#fff" : isLast ? "#B23B2E" : isNext ? "#4C8767" : "#A69C8C",
              }}>{s.label}{isLast && !sel ? " · last" : ""}{isNext && !sel ? " · next ✓" : ""}</button>
            );
          })}
        </div>
      </Card>

      {/* Side effects 1–5 */}
      <Card style={{ marginBottom: 12 }}>
        {sectionTitle("Side effects today (1–5)")}
        {GLP_SE.map((s) => (
          <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 0", borderTop: "1px solid rgba(120,106,84,0.22)" }}>
            <span style={{ fontSize: 14 }}>{s}</span>
            <TapScale value={(day.symptoms || {})[s] || 0} max={5} accent={accent} onChange={(v) => setDay({ symptoms: { ...day.symptoms, [s]: v } })} />
          </div>
        ))}
        <input placeholder="Note — dose change, what helped, triggers… (optional)" value={day.note || ""} onChange={(e) => setDay({ note: e.target.value })} style={{ ...inputStyle, minWidth: 0, marginTop: 10, fontSize: 13 }} />
      </Card>

      {/* Food noise */}
      <Card style={{ marginBottom: 12 }}>
        {sectionTitle("Food noise (1–10)")}
        <TapScale value={day.foodNoise || 0} max={10} accent={accent} onChange={(v) => setDay({ foodNoise: v })} />
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>1 = food thoughts are silent · 10 = constant food chatter. Watching this fade back in late in the dose week is exactly the pattern worth knowing.</div>
      </Card>

      {/* Hydration & fibre */}
      <Card style={{ marginBottom: 12 }}>
        {sectionTitle("Hydration & fibre")}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <button key={i} onClick={() => setCups(i + 1 === cups ? i : i + 1)} style={{
              flex: 1, minWidth: 0, height: 32, borderRadius: "0 0 8px 8px", cursor: "pointer",
              WebkitAppearance: "none", appearance: "none", padding: 0, boxSizing: "border-box",
              borderWidth: 2, borderStyle: "solid",
              borderColor: i < cups ? accent : "#A69C8C",
              background: i < cups ? accent : "rgba(166,156,140,0.18)",
            }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" inputMode="decimal" placeholder="Fibre grams" value={day.fibre ?? ""} onChange={(e) => setDay({ fibre: e.target.value === "" ? null : parseFloat(e.target.value) })} style={{ ...inputStyle, flex: 1, minWidth: 0, fontSize: 14 }} />
          <span style={{ fontSize: 12, color: "var(--mut)" }}>g today (25–30g is the usual target — key against constipation)</span>
        </div>
      </Card>

      {/* Digestion + Mood */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ ...headFont, fontWeight: 800, color: PINE_T }}>Bowel movement today</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[["Yes", true], ["No", false]].map(([L, v]) => (
              <button key={L} onClick={() => setDay({ bowel: day.bowel === v ? null : v })} style={{
                padding: "8px 16px", borderRadius: 18, cursor: "pointer", fontSize: 13, fontWeight: 700, ...font,
                borderWidth: 2, borderStyle: "solid",
                borderColor: day.bowel === v ? (v ? "#4C8767" : "#B23B2E") : "#A69C8C",
                background: day.bowel === v ? (v ? "#4C8767" : "#B23B2E") : "transparent",
                color: day.bowel === v ? "#fff" : "#A69C8C",
              }}>{L}</button>
            ))}
          </div>
        </div>
        <div style={{ ...headFont, fontWeight: 800, color: PINE_T, marginBottom: 8 }}>Mood / motivation (1–10)</div>
        <TapScale value={day.mood || 0} max={10} accent={accent} onChange={(v) => setDay({ mood: v })} />
      </Card>

      {/* Meal & energy diary */}
      <Card style={{ marginBottom: 12 }}>
        {sectionTitle("Meal & energy diary")}
        {(day.meals || []).map((m) => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: "1px solid rgba(120,106,84,0.22)", fontSize: 14 }}>
            <span><b style={{ ...numFont, fontSize: 15 }}>{m.time}</b> — energy {m.energy}/10</span>
            <button onClick={() => setDay({ meals: day.meals.filter((x) => x.id !== m.id) })} style={{ border: "none", background: "none", color: "#B77", cursor: "pointer" }}>✕</button>
          </div>
        ))}
        <div style={{ borderTop: "1px solid rgba(120,106,84,0.22)", paddingTop: 10, marginTop: 4 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="time" value={mealTime} onChange={(e) => setMealTime(e.target.value)} style={{ ...inputStyle, width: 100, minWidth: 0, padding: "8px 6px", fontSize: 13, WebkitAppearance: "none", appearance: "none" }} />
            <TapScale value={mealEnergy} max={10} accent={accent} size={24} onChange={setMealEnergy} />
            <Btn kind="teal" small onClick={() => { if (mealEnergy) { setDay({ meals: [...(day.meals || []), { id: "m" + Date.now(), time: mealTime, energy: mealEnergy }] }); setMealEnergy(0); } }}>Add</Btn>
          </div>
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 5 }}>Log meal time, then rate your energy ~30 min after eating. No calories — just the pattern.</div>
        </div>
      </Card>

      {/* Daily trends over time */}
      <GlpTrends glp={glp} accent={accent} dark={dark} />

      {/* 14-day pattern */}
      <Card style={{ marginBottom: 12 }}>
        {sectionTitle("14-day pattern")}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 70 }}>
          {days14.map((x) => (
            <div key={x.d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: "100%", height: Math.max(3, (x.burden / maxB) * 58), background: x.burden ? accent : "rgba(166,156,140,0.25)", borderRadius: 3 }} />
              <div style={{ fontSize: 9, color: x.inj ? accent : "var(--faint)", fontWeight: x.inj ? 800 : 400 }}>{x.inj ? "▲" : new Date(x.d + "T12:00").getDate()}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6 }}>Bar = total side-effect load · ▲ = injection day. The dose-day overlay chart lives in Trends.</div>
      </Card>

      {/* Injection history */}
      {injHistory.length > 0 && (
        <Card style={{ marginBottom: 12 }}>
          {sectionTitle("Injection history & site rotation")}
          {injHistory.slice(0, 8).map(([d, e]) => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid rgba(120,106,84,0.22)", fontSize: 13.5 }}>
              <span><b>{fmtDay(d)}</b>{e.med?.dose ? ` · ${e.med.name ? e.med.name + " " : ""}${e.med.dose}` : ""}</span>
              <span style={{ color: accent, fontWeight: 600 }}>{GLP_SITES.find((s) => s.id === e.site)?.label || "—"}</span>
            </div>
          ))}
        </Card>
      )}

      <div style={{ fontSize: 12, color: "var(--mut)", padding: "0 4px" }}>This tracker surfaces patterns to discuss with your prescriber — it isn't medical advice. Severe or persistent symptoms (vomiting that stops fluids staying down, severe abdominal pain) warrant contacting your doctor promptly.</div>
    </div>
  );
}

// ---------- First-run setup & data controls ----------

function DobPicker({ value, onChange }) {
  const init = (value || "").split("-");
  const [y, setY] = useState(init[0] || "");
  const [m, setM] = useState(init[1] || "");
  const [d, setD] = useState(init[2] || "");
  useEffect(() => {
    if (y && m && d) {
      let dd = d;
      const max = new Date(parseInt(y), parseInt(m), 0).getDate();
      if (parseInt(dd) > max) { dd = String(max).padStart(2, "0"); setD(dd); return; }
      const iso = `${y}-${m}-${dd}`;
      if (iso !== value) onChange(iso);
    }
  }, [y, m, d]);
  const s = { ...inputStyle, minHeight: 48, minWidth: 0, padding: "10px 6px", WebkitAppearance: "none", appearance: "none", textAlign: "center", flex: 1 };
  const now = new Date().getFullYear();
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <select value={d} onChange={(e) => setD(e.target.value)} style={s}>
        <option value="">DD</option>
        {Array.from({ length: 31 }).map((_, i) => { const v = String(i + 1).padStart(2, "0"); return <option key={v} value={v}>{i + 1}</option>; })}
      </select>
      <select value={m} onChange={(e) => setM(e.target.value)} style={{ ...s, flex: 1.4 }}>
        <option value="">MM</option>
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((n, i) => { const v = String(i + 1).padStart(2, "0"); return <option key={v} value={v}>{n}</option>; })}
      </select>
      <select value={y} onChange={(e) => setY(e.target.value)} style={{ ...s, flex: 1.4 }}>
        <option value="">YYYY</option>
        {Array.from({ length: 90 }).map((_, i) => { const v = String(now - 10 - i); return <option key={v} value={v}>{v}</option>; })}
      </select>
    </div>
  );
}

function Toggle({ on, onTap }) {
  return (
    <button onClick={onTap} className="tt-toggle-track" style={{ width: 54, height: 32, borderRadius: 16, cursor: "pointer", flexShrink: 0, position: "relative", borderWidth: 2, borderStyle: "solid", borderColor: on ? "#4C8767" : "#A69C8C", background: on ? "#4C8767" : "rgba(166,156,140,0.2)", padding: 0 }}>
      <span className="tt-toggle-thumb" style={{ position: "absolute", top: 2, left: on ? 24 : 2, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
    </button>
  );
}


function CsvExport({ csv }) {
  return (
    <div style={{ margin: "10px 0 2px" }}>
      <Btn kind="ghost" small onClick={() => {
        const blob = new Blob([csv()], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "training-table-" + todayISO() + ".csv";
        a.click();
      }}>Export CSV (for your GP / spreadsheets)</Btn>
    </div>
  );
}

function ResetControls({ resetContent, eraseAll }) {
  const [armed, setArmed] = useState(false);
  const [showErase, setShowErase] = useState(false);
  const [txt, setTxt] = useState("");
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn kind="ghost" small onClick={() => { if (armed) { resetContent(); } else { setArmed(true); setTimeout(() => setArmed(false), 4000); } }}>
          {armed ? "Tap again to confirm" : "Reset content to defaults"}
        </Btn>
        <Btn kind="danger" small onClick={() => setShowErase(!showErase)}>Erase all data…</Btn>
      </div>
      {armed && <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 6 }}>Restores recipes, schedule and supplements to factory. Weigh-ins, photos, workouts and habits are kept.</div>}
      {showErase && (
        <div style={{ marginTop: 10, borderWidth: 1.5, borderStyle: "solid", borderColor: "#B23B2E", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 13, marginBottom: 8 }}>This permanently deletes <b>everything</b> — weigh-ins, photos, workouts, habits, recipes and settings — and returns the app to first-run setup. Export a backup first if there's any doubt. Type <b>RESET</b> to confirm.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Type RESET" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
            <Btn kind="danger" onClick={() => { if (txt.trim().toUpperCase() === "RESET") eraseAll(); }} style={{ opacity: txt.trim().toUpperCase() === "RESET" ? 1 : 0.4 }}>Erase</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

const RESPONSIVE_CSS = `
  .tt-shell { max-width: 760px; margin: 0 auto; padding: 18px 16px 104px; }
  .tt-card { border: 1px solid #E8E0D2; }
  .tt-dark .tt-card { border: 1px solid #2A241C; }
  .tt-tabs { display: flex; gap: 2px; padding: 7px 10px; border-radius: 999px; width: fit-content; max-width: calc(100% - 24px); margin: 0 auto; border: 1px solid #E8E0D2; }
  .tt-dark .tt-tabs { border: 1px solid #2A241C; }
  @media (min-width: 1020px) {
    .tt-shell { max-width: 1150px; padding: 24px 26px 104px; }
    .tt-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; align-items: start; }
    .tt-cols > * { min-width: 0; }
    .tt-span2 { grid-column: 1 / -1; }
  }

  /* ---- neumorphic/glass accent layer ---- */
  .tt-card { transition: box-shadow .15s ease; }
  .tt-btn { transition: box-shadow .12s ease, transform .08s ease; }
  .tt-btn:active { transform: translateY(1px); }
  .tt-toggle-track { transition: box-shadow .15s ease; }
  .tt-toggle-thumb { transition: box-shadow .15s ease, left .15s; }

  /* LIGHT — shared warm-cream base across all three themes */
  .tt-light .tt-card { box-shadow: 8px 8px 18px rgba(60,50,35,0.10), -6px -6px 14px rgba(255,255,255,0.85); }
  .tt-light .tt-tabs { box-shadow: 6px 6px 14px rgba(60,50,35,0.10), -5px -5px 12px rgba(255,255,255,0.85); }
  .tt-light .tt-btn-primary, .tt-light .tt-btn-teal { box-shadow: 4px 4px 10px rgba(60,50,35,0.14), -2px -2px 7px rgba(255,255,255,0.5); }
  .tt-light .tt-btn-primary:hover, .tt-light .tt-btn-teal:hover { box-shadow: 5px 5px 13px rgba(60,50,35,0.17), -3px -3px 9px rgba(255,255,255,0.6); }
  .tt-light .tt-btn-primary:active, .tt-light .tt-btn-teal:active { box-shadow: inset 3px 3px 7px rgba(0,0,0,0.22), inset -2px -2px 5px rgba(255,255,255,0.15); }
  .tt-light .tt-btn-ghost, .tt-light .tt-btn-danger { box-shadow: 3px 3px 7px rgba(60,50,35,0.07), -2px -2px 6px rgba(255,255,255,0.7); }
  .tt-light .tt-btn-ghost:hover, .tt-light .tt-btn-danger:hover { box-shadow: 4px 4px 9px rgba(60,50,35,0.10), -3px -3px 7px rgba(255,255,255,0.8); }
  .tt-light .tt-btn-ghost:active, .tt-light .tt-btn-danger:active { box-shadow: inset 3px 3px 6px rgba(60,50,35,0.12), inset -2px -2px 5px rgba(255,255,255,0.6); }
  .tt-light .tt-toggle-track { box-shadow: inset 3px 3px 6px rgba(60,50,35,0.14), inset -2px -2px 5px rgba(255,255,255,0.5); }
  .tt-light .tt-toggle-thumb { box-shadow: 2px 2px 5px rgba(60,50,35,0.28), -1px -1px 3px rgba(255,255,255,0.6); }

  /* DARK — glass/blur fallback, per-theme tinted glow */
  .tt-dark .tt-card, .tt-dark .tt-tabs { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); background: rgba(255,255,255,0.045) !important; }
  .tt-dark .tt-btn-ghost, .tt-dark .tt-btn-danger { background: rgba(255,255,255,0.05) !important; }
  .tt-dark.tt-theme-forest .tt-card, .tt-dark.tt-theme-forest .tt-tabs { box-shadow: 0 6px 24px rgba(224,170,78,0.10); }
  .tt-dark.tt-theme-forest .tt-btn-primary, .tt-dark.tt-theme-forest .tt-btn-teal { box-shadow: 0 4px 16px rgba(224,170,78,0.30); }
  .tt-dark.tt-theme-navy .tt-card, .tt-dark.tt-theme-navy .tt-tabs { box-shadow: 0 6px 24px rgba(224,136,86,0.10); }
  .tt-dark.tt-theme-navy .tt-btn-primary, .tt-dark.tt-theme-navy .tt-btn-teal { box-shadow: 0 4px 16px rgba(224,136,86,0.30); }
  .tt-dark.tt-theme-plum .tt-card, .tt-dark.tt-theme-plum .tt-tabs { box-shadow: 0 6px 24px rgba(214,154,108,0.10); }
  .tt-dark.tt-theme-plum .tt-btn-primary, .tt-dark.tt-theme-plum .tt-btn-teal { box-shadow: 0 4px 16px rgba(214,154,108,0.30); }
  .tt-dark .tt-btn-primary:active, .tt-dark .tt-btn-teal:active { box-shadow: inset 0 2px 8px rgba(0,0,0,0.5) !important; }
  .tt-dark .tt-btn-ghost:active, .tt-dark .tt-btn-danger:active { background: rgba(255,255,255,0.02) !important; box-shadow: inset 0 2px 6px rgba(0,0,0,0.4) !important; }
  .tt-dark .tt-toggle-track { background: rgba(255,255,255,0.05) !important; box-shadow: inset 0 2px 6px rgba(0,0,0,0.45); }
  .tt-dark .tt-toggle-thumb { box-shadow: 0 2px 6px rgba(0,0,0,0.5); }
`;

// ---------- App shell ----------
const TABS = [
  { id: "today", label: "Today", icon: "☀" },
  { id: "dash", label: "Trends", icon: "◧" },
  { id: "log", label: "Daily Log", icon: "✎" },
  { id: "glp", label: "GLP-1", icon: "✚" },
  { id: "habits", label: "Habits", icon: "✓" },
  { id: "week", label: "Schedule", icon: "▤" },
  { id: "meals", label: "Meals", icon: "◍" },
  { id: "me", label: "Me", icon: "◉" },
];

export default function HealthTracker() {
  const [tab, setTab] = useState("today");
  const [entries, setEntries] = useState([]);
  const [habits, setHabits] = useState({});
  const [recipes, setRecipes] = useState(DEFAULT_RECIPES);
  const [goal, setGoalState] = useState(0);
  const [profile, setProfile] = useState({ name: "", dob: "", sex: "male", heightCm: "", startWeight: "" });
  const [photos, setPhotos] = useState([]);
  const [supps, setSupps] = useState(DEFAULT_SUPPS);
  const [week, setWeek] = useState(DEFAULT_WEEK);
  const [water, setWater] = useState({});
  const [workouts, setWorkouts] = useState([]);
  const [theme, setThemeState] = useState("auto");
  const [seenMs, setSeenMs] = useState([]);
  const [colorTheme, setColorThemeState] = useState("pine");
  const [glp, setGlp] = useState({});
  const [glpSettings, setGlpSettings] = useState({ name: "", dose: "" });
  const [shopping, setShopping] = useState([]);
  const [tabsEnabled, setTabsEnabled] = useState({});
  const [holidays, setHolidays] = useState([]);
  const [schedDone, setSchedDone] = useState({});
  const [sysDark, setSysDark] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [loaded, setLoaded] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastRef = useRef(null);
  const showToast = (m) => { setToastMsg(m); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToastMsg(""), 2200); };

  useEffect(() => {
    (async () => {
      setEntries(await sGet("entries", []));
      setHabits(await sGet("habits", {}));
      let recs = await sGet("recipes", DEFAULT_RECIPES);
      const rVer = await sGet("recipesVersion", null);
      if (rVer === null && recs !== DEFAULT_RECIPES) {
        // Existing users: append newly added default recipes they've never seen (b6+/d6+)
        const have = new Set(recs.map((r) => r.id));
        const additions = DEFAULT_RECIPES.filter((r) => /^[bd](6|7|8|9|1[0-5])$/.test(r.id) && !have.has(r.id));
        if (additions.length) { recs = [...recs, ...additions]; sSet("recipes", recs); }
      }
      sSet("recipesVersion", 2);
      setRecipes(recs);
      setGoalState(await sGet("goal", 0));
      const storedProfile = await sGet("profile", null);
      if (storedProfile) setProfile((d) => ({ ...d, ...storedProfile }));
      setPhotos(await sGet("photoIndex", []));
      setSupps(await sGet("supplements", DEFAULT_SUPPS));
      setWeek(await sGet("week", DEFAULT_WEEK));
      setWater(await sGet("water", {}));
      setWorkouts(await sGet("workouts", []));
      setThemeState(await sGet("theme", "auto"));
      setSeenMs(await sGet("seenMilestones", []));
      setColorThemeState(await sGet("colorTheme", "pine"));
      setGlp(await sGet("glp", {}));
      setGlpSettings(await sGet("glpSettings", { name: "", dose: "" }));
      setShopping(await sGet("shopping", []));
      setTabsEnabled(await sGet("tabsEnabled", {}));
      setHolidays(await sGet("holidays", []));
      setSchedDone(await sGet("schedDone", {}));
      setLoaded(true);
    })();
  }, []);

  const saveEntries = (v) => { setEntries(v); sSet("entries", v); };
  const saveHabits = (v) => { setHabits(v); sSet("habits", v); };
  const saveRecipes = (v) => { setRecipes(v); sSet("recipes", v); };
  const setGoal = (v) => { setGoalState(v); sSet("goal", v); };
  const saveProfile = (v) => { setProfile(v); sSet("profile", v); };
  const savePhotos = (v) => { setPhotos(v); sSet("photoIndex", v); };
  const saveSupps = (v) => { setSupps(v); sSet("supplements", v); };
  const saveWeek = (v) => { setWeek(v); sSet("week", v); };
  const saveWater = (v) => { setWater(v); sSet("water", v); };
  const saveWorkouts = (v) => { setWorkouts(v); sSet("workouts", v); };
  const setTheme = (v) => { setThemeState(v); sSet("theme", v); };
  const saveSeenMs = (v) => { setSeenMs(v); sSet("seenMilestones", v); };
  const setColorTheme = (v) => { setColorThemeState(v); sSet("colorTheme", v); };
  const saveGlp = (v) => { setGlp(v); sSet("glp", v); };
  const saveGlpSettings = (v) => { setGlpSettings(v); sSet("glpSettings", v); };
  const saveShopping = (v) => { setShopping(v); sSet("shopping", v); };
  const saveTabsEnabled = (v) => { setTabsEnabled(v); sSet("tabsEnabled", v); };
  const saveHolidays = (v) => { setHolidays(v); sSet("holidays", v); };

  const saveSchedDone = (v) => { setSchedDone(v); sSet("schedDone", v); };
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setSysDark(e.matches);
    mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn);
    return () => { mq.removeEventListener ? mq.removeEventListener("change", fn) : mq.removeListener(fn); };
  }, []);
  const dark = theme === "dark" || (theme === "auto" && sysDark);
  const pal = COLOR_THEMES.find((t) => t.id === colorTheme) || COLOR_THEMES[0];
  const macroT = calcMacros(profile, entries);

  const heightM = (parseFloat(profile.heightCm) || 178) / 100;

  return (
    <div className={(dark ? "tt-dark" : "tt-light") + " tt-theme-" + colorTheme} style={{ ...font, ...themeVars(colorTheme, dark), background: MIST, minHeight: "100vh", color: INK }}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />
      <style>{RESPONSIVE_CSS}</style>
      <div className="tt-shell">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ ...numFont, fontSize: 26, ...headFont, fontWeight: 800, color: PINE_T, letterSpacing: 0.5 }}>TREND</div>
          <div style={{ fontSize: 12, color: "var(--mut)" }}>{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        {!loaded ? <div style={{ textAlign: "center", color: "var(--mut)", padding: 60 }}>Loading your data…</div> : (
          <>
            {tab === "today" && <Today profile={profile} entries={entries} saveEntries={saveEntries} habits={habits} saveHabits={saveHabits} week={week} supps={supps} water={water} saveWater={saveWater} workouts={workouts} goal={goal} heightM={heightM} seenMs={seenMs} saveSeenMs={saveSeenMs} schedDone={schedDone} saveSchedDone={saveSchedDone} accent={dark ? pal.accD : pal.accL} holidays={holidays} glp={glp} glpEnabled={!!profile.glpEnabled} go={setTab} />}
            {tab === "dash" && <Dashboard entries={entries} habits={habits} goal={goal} setGoal={setGoal} heightM={heightM} profile={profile} workouts={workouts} water={water} saveWater={saveWater} dark={dark} pal={pal} holidays={holidays} glp={glp} />}
            {tab === "log" && <DailyLog entries={entries} save={saveEntries} heightM={heightM} workouts={workouts} saveWorkouts={saveWorkouts} />}
            {tab === "glp" && profile.glpEnabled && <Glp glp={glp} saveGlp={saveGlp} accent={dark ? pal.accD : pal.accL} water={water} saveWater={saveWater} settings={glpSettings} saveSettings={saveGlpSettings} dark={dark} />}
            {tab === "habits" && <Habits habits={habits} save={saveHabits} />}
            {tab === "week" && <Schedule supps={supps} week={week} saveWeek={saveWeek} />}
            {tab === "meals" && <Meals recipes={recipes} save={saveRecipes} shopping={shopping} saveShopping={saveShopping} lunchEst={profile.lunchMacros || LUNCH_SNACKS_DEFAULT} macroT={macroT} toast={showToast} />}
            {tab === "me" && <Profile profile={profile} saveProfile={saveProfile} goal={goal} setGoal={setGoal} entries={entries} photos={photos} savePhotos={savePhotos} supps={supps} saveSupps={saveSupps} theme={theme} setTheme={setTheme} colorTheme={colorTheme} setColorTheme={setColorTheme} tabsEnabled={tabsEnabled} saveTabsEnabled={saveTabsEnabled} holidays={holidays} saveHolidays={saveHolidays} water={water} glp={glp} workouts={workouts} />}
          </>
        )}
      </div>
      {/* Bottom tab bar */}
      <Toast msg={toastMsg} />
      {loaded && <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "transparent", padding: "0 12px calc(10px + env(safe-area-inset-bottom))", pointerEvents: "none" }}>
        <div className="tt-tabs" style={{ background: "var(--surface)", pointerEvents: "auto" }}>
        {TABS.filter((t) => (t.id === "today" || t.id === "me") ? true : t.id === "glp" ? !!profile.glpEnabled : tabsEnabled[t.id] !== false).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 5px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, ...font }}>
            <span style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
              background: tab === t.id ? "var(--teal-soft)" : "transparent",
              color: tab === t.id ? "var(--pine-t)" : "var(--mut)" }}>{t.icon}</span>
            <span style={{ fontSize: 8.5, fontWeight: tab === t.id ? 800 : 500, color: tab === t.id ? "var(--ink)" : "var(--faint)", ...headFont }}>{t.label}</span>
          </button>
        ))}
        </div>
      </div>}
    </div>
  );
}
