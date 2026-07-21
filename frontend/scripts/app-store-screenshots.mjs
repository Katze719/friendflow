import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const outputDir = resolve(projectRoot, "app-store-screenshots");
const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:5179";
const layoutCheckOnly = process.argv.includes("--check-layout");

const devices = [
  {
    name: "iphone-6-5",
    viewport: { width: 414, height: 896 },
    expected: { width: 1242, height: 2688 },
    scale: 3,
  },
  {
    name: "iphone-6-7",
    viewport: { width: 428, height: 926 },
    expected: { width: 1284, height: 2778 },
    scale: 3,
  },
  {
    name: "ipad-12-9",
    viewport: { width: 1024, height: 1366 },
    expected: { width: 2048, height: 2732 },
    scale: 2,
    isMobile: false,
  },
  {
    name: "ipad-13",
    viewport: { width: 1032, height: 1376 },
    expected: { width: 2064, height: 2752 },
    scale: 2,
    isMobile: false,
  },
];

const scenes = [
  {
    name: "01-dashboard",
    path: "/",
    ready: /Gruppen|Groups/i,
  },
  {
    name: "02-trip-planner",
    path: "/groups/g1/trips/trip1",
    ready: /Summer in Porto/i,
  },
  {
    name: "03-shopping-list",
    path: "/groups/g1/shopping/list1",
    ready: /House Groceries/i,
  },
];

const now = "2026-07-05T10:00:00.000Z";
const user = {
  id: "u1",
  email: "paul@example.com",
  display_name: "Paul",
  status: "approved",
  is_admin: false,
  created_at: "2026-01-10T12:00:00.000Z",
};
const members = [
  member("u1", "Paul", "owner"),
  member("u2", "Mara"),
  member("u3", "Luca"),
  member("u4", "Nina"),
];
const group = {
  id: "g1",
  name: "Summer House",
  invite_code: "PORTO26",
  currency: "EUR",
  created_by: "u1",
  created_at: "2026-02-01T12:00:00.000Z",
  members,
  my_role: "owner",
};
const groupSummary = {
  id: group.id,
  name: group.name,
  invite_code: group.invite_code,
  currency: group.currency,
  created_at: group.created_at,
  member_count: group.members.length,
  my_role: group.my_role,
};
const trip = {
  id: "trip1",
  group_id: group.id,
  name: "Summer in Porto",
  start_date: "2026-08-14",
  end_date: "2026-08-18",
  destinations: [
    { name: "Porto, Portugal", lat: 41.1579, lng: -8.6291 },
    { name: "Douro Valley", lat: 41.1677, lng: -7.7893 },
  ],
  budget_cents: 120000,
  spent_cents: 76450,
  position: 1,
  created_by: user.id,
  created_by_display_name: user.display_name,
  created_at: "2026-06-01T12:00:00.000Z",
  updated_at: now,
};
const tripLinks = [
  link("l1", "Boutique Hotel Ribeira", "https://example.com/hotel", 5, 0, "Stay"),
  link("l2", "Douro Boat Tour", "https://example.com/boat", 4, 1, "Activities"),
  link("l3", "Francesinha Spot", "https://example.com/food", 3, 0, "Food"),
];
const itinerary = [
  itineraryItem("it1", "2026-08-14", "Arrival and check-in", "16:30", "18:00", "Ribeira"),
  itineraryItem("it2", "2026-08-15", "Douro boat tour", "10:00", "14:00", "Cais da Ribeira"),
  itineraryItem("it3", "2026-08-16", "Dinner and sunset", "19:30", "22:00", "Jardim do Morro"),
];
const packing = [
  packingItem("p1", "Sunscreen", "1", "Bathroom", true, "u2", "Mara"),
  packingItem("p2", "Power bank", "2", "Tech", false, null, null),
  packingItem("p3", "Passport", "all", "Documents", false, null, null),
];
const shoppingLists = [
  list("list1", "House Groceries", 6, 3),
  list("list2", "Porto Snacks", 4, 1),
  list("list3", "Bath & Household", 2, 5),
];
const shoppingItems = [
  item("si1", "Oat milk", "2x", "", false, "u2", "Mara"),
  item("si2", "Pasta", "500 g", "for Tuesday", false, "u3", "Luca"),
  item("si3", "Tomatoes", "1 kg", "", false, "u1", "Paul"),
  item("si4", "Coffee", "1 pack", "", false, "u4", "Nina"),
  item("si5", "Basil", "1 plant", "", false, "u2", "Mara"),
  item("si6", "Sparkling water", "6 bottles", "", false, "u1", "Paul"),
  item("si7", "Olive oil", "1", "", true, "u3", "Luca"),
  item("si8", "Kitchen roll", "2", "", true, "u4", "Nina"),
  item("si9", "Lemons", "4", "", true, "u2", "Mara"),
];

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  if (!layoutCheckOnly) mkdirSync(outputDir, { recursive: true });
  const server = process.env.SCREENSHOT_BASE_URL ? null : await startVite();
  const browser = await chromium.launch({
    executablePath: findChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    if (layoutCheckOnly) {
      await runAccessibilityLayoutChecks(browser);
      return;
    }

    const manifest = [];
    for (const device of devices) {
      const context = await browser.newContext({
        viewport: device.viewport,
        deviceScaleFactor: device.scale,
        isMobile: device.isMobile ?? true,
        hasTouch: true,
        locale: "en-US",
        colorScheme: "light",
      });
      await installDemoState(context);
      await context.route(`${baseUrl}/api/**`, mockApiRoute);

      for (const scene of scenes) {
        const page = await context.newPage();
        page.on("console", (message) => {
          console.error(`[browser:${scene.name}:${message.type()}] ${message.text()}`);
        });
        page.on("pageerror", (error) => {
          console.error(`[pageerror:${scene.name}] ${error.message}`);
        });
        page.on("requestfailed", (request) => {
          console.error(
            `[requestfailed:${scene.name}] ${request.method()} ${request.url()} ${request.failure()?.errorText}`,
          );
        });
        await page.goto(`${baseUrl}${scene.path}`, { waitUntil: "networkidle" });
        try {
          await page.getByText(scene.ready).first().waitFor({ timeout: 10_000 });
        } catch (error) {
          await page.screenshot({
            path: join(outputDir, `_debug-${device.name}-${scene.name}.png`),
            fullPage: false,
          });
          await writeFile(
            join(outputDir, `_debug-${device.name}-${scene.name}.html`),
            await page.content(),
          );
          throw error;
        }
        await page.waitForTimeout(350);

        const file = join(outputDir, `${device.name}-${scene.name}.png`);
        await page.screenshot({ path: file, fullPage: false });
        const size = await imageSize(page);
        manifest.push({ file, width: size.width, height: size.height });
        if (size.width !== device.expected.width || size.height !== device.expected.height) {
          throw new Error(
            `${file} is ${size.width}x${size.height}, expected ${device.expected.width}x${device.expected.height}`,
          );
        }
        await page.close();
      }
      await context.close();
    }
    await writeFile(
      join(outputDir, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );
    console.log(`Wrote ${manifest.length} screenshots to ${outputDir}`);
  } finally {
    await browser.close();
    if (server) {
      server.kill("SIGTERM");
      await new Promise((resolveDone) => server.once("exit", resolveDone));
    }
  }
}

async function runAccessibilityLayoutChecks(browser) {
  const viewports = [
    { name: "compact", width: 320, height: 700 },
    { name: "iphone", width: 375, height: 812 },
  ];
  const fontScales = [100, 150, 200];

  for (const viewport of viewports) {
    for (const fontScale of fontScales) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: true,
        hasTouch: true,
        locale: "de-DE",
        colorScheme: "dark",
      });
      await installDemoState(context, {
        language: "de",
        rootFontScale: fontScale,
        emptyDashboard: true,
      });
      await context.route(`${baseUrl}/api/**`, mockApiRoute);
      await context.route(`${baseUrl}/api/groups`, (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "[]",
        }),
      );

      try {
        for (const scene of scenes) {
          const page = await context.newPage();
          const caseName = `${viewport.name}:${fontScale}%:${scene.name}`;
          try {
            await page.goto(`${baseUrl}${scene.path}`, { waitUntil: "networkidle" });
            await page.getByText(scene.ready).first().waitFor({ timeout: 10_000 });
            await page.waitForTimeout(100);
            await assertResponsiveLayout(page, caseName);
          } finally {
            await page.close();
          }
        }
        const settingsPage = await context.newPage();
        const settingsCaseName = `${viewport.name}:${fontScale}%:settings`;
        try {
          await settingsPage.goto(`${baseUrl}/me/settings`, { waitUntil: "networkidle" });
          await settingsPage.locator('[data-testid="settings-hub"]').waitFor({ timeout: 10_000 });
          await assertResponsiveLayout(settingsPage, settingsCaseName);
          await assertSettingsHub(settingsPage, settingsCaseName);
          await assertPreferences(settingsPage, settingsCaseName);
        } finally {
          await settingsPage.close();
        }
      } finally {
        await context.close();
      }
    }
  }

  console.log(
    `Accessibility layout checks passed for ${viewports.length * fontScales.length * (scenes.length + 1)} cases.`,
  );
}

async function assertSettingsHub(page, caseName) {
  const result = await page.locator('[data-testid="settings-hub"]').evaluate((hub) => ({
    accentAndLanguageOptions: hub.querySelectorAll('[role="radio"]').length,
    themeOptions: hub.querySelectorAll('button[aria-pressed]').length,
    headerIconSwitches: hub.querySelectorAll('[role="switch"]').length,
    signOutButtons: Array.from(hub.querySelectorAll("button")).filter((button) =>
      /abmelden|sign out/i.test(button.textContent ?? ""),
    ).length,
  }));
  const failures = [];
  if (result.accentAndLanguageOptions !== 13) {
    failures.push(`expected 13 accent/language options, found ${result.accentAndLanguageOptions}`);
  }
  if (result.themeOptions !== 3) {
    failures.push(`expected 3 display mode options, found ${result.themeOptions}`);
  }
  if (result.headerIconSwitches !== 1) failures.push("header icon switch is missing");
  if (result.signOutButtons !== 1) failures.push("sign-out action is missing");
  if (failures.length > 0) throw new Error(`${caseName}: ${failures.join("; ")}`);
}

async function assertPreferences(page, caseName) {
  const hub = page.locator('[data-testid="settings-hub"]');
  const radioOptions = hub.locator('[role="radio"]');
  await radioOptions.nth(7).click();
  await page.waitForTimeout(200);
  const accentResult = await page.evaluate(() => ({
    attribute: document.documentElement.dataset.accent,
    stored: localStorage.getItem("friendflow.accent"),
    primary: getComputedStyle(document.querySelector(".btn-primary")).backgroundColor,
  }));
  if (
    accentResult.attribute !== "pink" ||
    accentResult.stored !== "pink" ||
    accentResult.primary !== "rgb(181, 23, 158)"
  ) {
    throw new Error(`${caseName}: pink accent was not applied: ${JSON.stringify(accentResult)}`);
  }

  const iconToggle = hub.locator('[data-testid="header-icon-toggle"]');
  await iconToggle.click();
  const iconResult = await page.evaluate(() => ({
    stored: localStorage.getItem("friendflow.headerIcon"),
    visible: document.querySelector('[data-testid="header-icon"]') !== null,
  }));
  if (iconResult.stored !== "hidden" || iconResult.visible) {
    throw new Error(`${caseName}: header icon was not hidden: ${JSON.stringify(iconResult)}`);
  }

  await radioOptions.nth(10).click();
  const languageResult = await page.evaluate(() => ({
    htmlLang: document.documentElement.lang,
    stored: localStorage.getItem("friendflow.lang"),
  }));
  if (languageResult.htmlLang !== "fr" || languageResult.stored !== "fr") {
    throw new Error(`${caseName}: French language was not persisted: ${JSON.stringify(languageResult)}`);
  }
}

async function assertResponsiveLayout(page, caseName) {
  const result = await page.evaluate(() => {
    const documentElement = document.documentElement;
    const root = document.getElementById("root");
    const minimumEditableFontSize = Math.max(
      16,
      Number.parseFloat(getComputedStyle(documentElement).fontSize),
    );
    const nonEditableInputTypes = new Set([
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit",
    ]);
    const undersizedEditableControls = Array.from(
      document.querySelectorAll("input, select, textarea"),
    )
      .filter(
        (control) =>
          control.tagName !== "INPUT" || !nonEditableInputTypes.has(control.type.toLowerCase()),
      )
      .map((control) => ({
        element: control.tagName.toLowerCase(),
        type: control.getAttribute("type") || null,
        name: control.getAttribute("name") || control.getAttribute("id") || null,
        fontSize: Number.parseFloat(getComputedStyle(control).fontSize),
      }))
      .filter((control) => control.fontSize < minimumEditableFontSize);
    const nav = document.querySelector('[data-testid="mobile-bottom-nav"]');
    const headerActions = document.querySelector('[data-testid="header-actions"]');
    const navRect = nav?.getBoundingClientRect() ?? null;
    const navLinks = nav
      ? Array.from(nav.querySelectorAll("a")).map((link) => {
          const rect = link.getBoundingClientRect();
          return {
            label: link.getAttribute("title") || link.textContent?.trim() || "unknown",
            left: rect.left,
            right: rect.right,
            width: rect.width,
            height: rect.height,
          };
        })
      : [];

    return {
      url: window.location.href,
      bodyText: document.body.innerText.slice(0, 500),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentClientWidth: documentElement.clientWidth,
      documentScrollWidth: documentElement.scrollWidth,
      rootClientWidth: root?.clientWidth ?? null,
      rootScrollWidth: root?.scrollWidth ?? null,
      minimumEditableFontSize,
      undersizedEditableControls,
      navRect: navRect
        ? {
            left: navRect.left,
            right: navRect.right,
            bottom: navRect.bottom,
            width: navRect.width,
            height: navRect.height,
          }
        : null,
      navLinks,
      headerActionsVisible:
        headerActions !== null && headerActions.getClientRects().length > 0,
    };
  });

  const tolerance = 1;
  const failures = [];
  if (result.documentScrollWidth > result.documentClientWidth + tolerance) {
    failures.push(
      `document width ${result.documentScrollWidth}px exceeds ${result.documentClientWidth}px`,
    );
  }
  if (
    result.rootClientWidth !== null &&
    result.rootScrollWidth !== null &&
    result.rootScrollWidth > result.rootClientWidth + tolerance
  ) {
    failures.push(`root width ${result.rootScrollWidth}px exceeds ${result.rootClientWidth}px`);
  }
  if (result.undersizedEditableControls.length > 0) {
    failures.push(
      `editable controls below ${result.minimumEditableFontSize}px: ${JSON.stringify(result.undersizedEditableControls)}`,
    );
  }
  if (result.headerActionsVisible) {
    failures.push("mobile header actions are visible");
  }
  if (!result.navRect) {
    failures.push("mobile bottom navigation is missing");
  } else {
    if (result.navRect.left < -tolerance || result.navRect.right > result.viewportWidth + tolerance) {
      failures.push(
        `navigation bounds ${result.navRect.left}-${result.navRect.right}px leave the viewport`,
      );
    }
    if (Math.abs(result.navRect.bottom - result.viewportHeight) > tolerance) {
      failures.push(
        `navigation bottom ${result.navRect.bottom}px is not pinned to ${result.viewportHeight}px`,
      );
    }
    if (result.navLinks.length !== 5) {
      failures.push(`expected 5 navigation links, found ${result.navLinks.length}`);
    }
    for (const link of result.navLinks) {
      if (
        link.width <= 0 ||
        link.height <= 0 ||
        link.left < -tolerance ||
        link.right > result.viewportWidth + tolerance
      ) {
        failures.push(`navigation link ${link.label} is outside the viewport`);
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`${caseName}: ${failures.join("; ")}\n${JSON.stringify(result, null, 2)}`);
  }
}

async function startVite() {
  const viteBin = resolve(projectRoot, "node_modules/.bin/vite");
  const child = spawn(
    viteBin,
    ["--host", "127.0.0.1", "--port", "5179", "--strictPort"],
    {
      cwd: projectRoot,
      env: { ...process.env, VITE_LANDING_MODE: "landing" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  await waitForServer(baseUrl, child);
  return child;
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 30_000;
  let exitCode = null;
  child.once("exit", (code) => {
    exitCode = code;
  });
  while (Date.now() < deadline) {
    if (exitCode !== null) {
      throw new Error(`Vite exited before becoming ready (code ${exitCode})`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("No Chromium executable found. Set CHROMIUM_PATH to a Chrome/Chromium binary.");
}

async function installDemoState(
  context,
  { language = "en", rootFontScale = 100, emptyDashboard = false } = {},
) {
  await context.addInitScript(
    ({ user, groupSummary, language, rootFontScale, emptyDashboard }) => {
      const namespace = "default%3A";
      localStorage.setItem("i18nextLng", language);
      localStorage.setItem("friendflow.theme", emptyDashboard ? "dark" : "light");
      localStorage.setItem(`friendflow.token.${namespace}`, "app-store-demo-token");
      localStorage.setItem(`friendflow.user.${namespace}`, JSON.stringify(user));
      localStorage.setItem(
        `friendflow.groups.${namespace}`,
        JSON.stringify(emptyDashboard ? [] : [groupSummary]),
      );
      if (!emptyDashboard) {
        localStorage.setItem(`friendflow.onboarding.dismissed.${namespace}`, "1");
      }
      localStorage.setItem(
        "friendflow.homeToolShortcuts",
        JSON.stringify(
          emptyDashboard
            ? []
            : [
                { groupId: groupSummary.id, toolId: "trips", addedAt: "2026-07-01T10:00:00.000Z" },
                { groupId: groupSummary.id, toolId: "shopping", addedAt: "2026-07-01T10:00:00.000Z" },
                { groupId: groupSummary.id, toolId: "splitwise", addedAt: "2026-07-01T10:00:00.000Z" },
              ],
        ),
      );
      localStorage.setItem("friendflow.banner.tripList", "1");
      const applyRootFontScale = () => {
        document.documentElement.style.fontSize = `${rootFontScale}%`;
      };
      if (document.documentElement) applyRootFontScale();
      else document.addEventListener("DOMContentLoaded", applyRootFontScale, { once: true });
    },
    { user, groupSummary, language, rootFontScale, emptyDashboard },
  );
}

async function mockApiRoute(route) {
  const request = route.request();
  const url = new URL(request.url());
  const path = url.pathname;
  const method = request.method();

  if (method !== "GET") {
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  }

  const data = getMock(path);
  if (data === undefined) {
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: `No screenshot mock for ${path}` }),
    });
  }
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
}

function getMock(path) {
  const staticResponses = {
    "/api/auth/config": {
      registration_mode: "open",
      password_reset_enabled: true,
      instance_name: "friendflow",
    },
    "/api/auth/me": user,
    "/api/admin/users": [],
    "/api/groups": [groupSummary],
    "/api/groups/g1": group,
    "/api/groups/g1/trips": [trip],
    "/api/groups/g1/trips/trip1": trip,
    "/api/groups/g1/trips/trip1/links": tripLinks,
    "/api/groups/g1/trips/trip1/itinerary": itinerary,
    "/api/groups/g1/trips/trip1/packing": packing,
    "/api/groups/g1/shopping/lists": shoppingLists,
    "/api/groups/g1/shopping/lists/list1/items": shoppingItems,
    "/api/groups/g1/splitwise/summary": splitwiseSummary(),
    "/api/groups/g1/splitwise/expenses": splitwiseExpenses(),
    "/api/groups/g1/splitwise/payments": [],
    "/api/groups/g1/calendar/events": calendarEvents(),
    "/api/groups/g1/calendar/categories": calendarCategories(),
    "/api/me/calendar/events": [],
  };
  return staticResponses[path];
}

async function imageSize(page) {
  return page.evaluate(() => {
    return {
      width: window.innerWidth * window.devicePixelRatio,
      height: window.innerHeight * window.devicePixelRatio,
    };
  });
}

function member(id, displayName, role = "member") {
  return {
    id,
    display_name: displayName,
    email: `${displayName.toLowerCase()}@example.com`,
    role,
    joined_at: "2026-02-01T12:00:00.000Z",
  };
}

function link(id, title, url, likes, dislikes, folderName) {
  return {
    id,
    trip_id: trip.id,
    url,
    title,
    description: "Suggested by the group",
    image_url: null,
    site_name: "Example",
    title_override: null,
    image_override: null,
    note: "",
    added_by: "u2",
    added_by_display_name: "Mara",
    created_at: now,
    fetched_at: now,
    likes,
    dislikes,
    my_vote: likes > 3 ? 1 : 0,
    folder_id: folderName.toLowerCase(),
    folder_name: folderName,
    position: 1,
  };
}

function itineraryItem(id, dayDate, title, startTime, endTime, location) {
  return {
    id,
    trip_id: trip.id,
    day_date: dayDate,
    title,
    start_time: startTime,
    end_time: endTime,
    location,
    note: "",
    link_id: null,
    link_title: null,
    link_url: null,
    position: 1,
    created_by: "u1",
    created_by_display_name: "Paul",
    created_at: now,
    updated_at: now,
  };
}

function packingItem(id, name, quantity, category, isPacked, assignedTo, assignedName) {
  return {
    id,
    trip_id: trip.id,
    name,
    quantity,
    category,
    is_packed: isPacked,
    assigned_to: assignedTo,
    assigned_to_display_name: assignedName,
    position: 1,
    created_by: "u1",
    created_by_display_name: "Paul",
    created_at: now,
    updated_at: now,
  };
}

function list(id, name, open, done) {
  return {
    id,
    group_id: group.id,
    owner_user_id: null,
    name,
    items_open: open,
    items_done: done,
    created_by: user.id,
    created_at: now,
  };
}

function item(id, name, quantity, note, isDone, addedBy, addedByName) {
  return {
    id,
    group_id: group.id,
    owner_user_id: null,
    list_id: "list1",
    name,
    quantity,
    note,
    is_done: isDone,
    done_at: isDone ? now : null,
    done_by: isDone ? addedBy : null,
    done_by_display_name: isDone ? addedByName : null,
    added_by: addedBy,
    added_by_display_name: addedByName,
    created_at: now,
  };
}

function splitwiseSummary() {
  return {
    currency: "EUR",
    balances: [
      { user_id: "u1", display_name: "Paul", balance_cents: 2480 },
      { user_id: "u2", display_name: "Mara", balance_cents: -1210 },
      { user_id: "u3", display_name: "Luca", balance_cents: -760 },
      { user_id: "u4", display_name: "Nina", balance_cents: -510 },
    ],
    settlements: [
      {
        from_user_id: "u2",
        from_display_name: "Mara",
        to_user_id: "u1",
        to_display_name: "Paul",
        amount_cents: 1210,
      },
      {
        from_user_id: "u3",
        from_display_name: "Luca",
        to_user_id: "u1",
        to_display_name: "Paul",
        amount_cents: 760,
      },
    ],
    direct_settlements: [],
    my_balance_cents: 2480,
  };
}

function splitwiseExpenses() {
  return [
    {
      id: "e1",
      group_id: group.id,
      paid_by: "u1",
      paid_by_display_name: "Paul",
      description: "Supermarkt",
      amount_cents: 6840,
      happened_at: "2026-07-04T18:20:00.000Z",
      created_at: now,
      trip_id: null,
      trip_name: null,
      splits: members.map((m) => ({
        user_id: m.id,
        display_name: m.display_name,
        amount_cents: 1710,
      })),
    },
  ];
}

function calendarCategories() {
  return [
    {
      id: "cat1",
      name: "Gruppe",
      color: "#2563eb",
      group_id: group.id,
      owner_user_id: null,
      created_at: now,
    },
  ];
}

function calendarEvents() {
  return [
    {
      id: "cal1",
      group_id: group.id,
      owner_user_id: null,
      title: "Plan summer party",
      description: "",
      location: "House kitchen",
      starts_at: "2026-07-12T18:00:00.000Z",
      ends_at: "2026-07-12T20:00:00.000Z",
      all_day: false,
      category: { id: "cat1", name: "Gruppe", color: "#2563eb" },
      created_by: user.id,
      created_by_display_name: user.display_name,
      created_at: now,
      updated_at: now,
    },
  ];
}
