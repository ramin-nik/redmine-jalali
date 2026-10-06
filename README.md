# redmine_jalali

Jalali (Solar Hijri / Persian) calendar for Redmine. It changes how dates are
**shown** and **entered**. The database and the REST API are not touched.

- No database migrations
- Dates stay Gregorian/UTC in PostgreSQL
- REST API keeps ISO dates (`YYYY-MM-DD`)
- Works per user language: Jalali is used only when the user's locale is enabled (default: `fa`)

Tested on Redmine 7.0.1 (`redmine:7.0.1-alpine`, Ruby 4.0, Rails 8.1, PostgreSQL 14).

## Features

- Issues, time entries, journals, wiki, mails, and CSV/PDF exports show Jalali dates
  (via `Redmine::I18n#format_date`, which `format_time` also uses).
- Every date field (issue start/due date, time entry date, custom fields, query
  filters, etc.) gets a Jalali text field with a popup date picker.
- The original `<input type="date">` stays in the page and keeps the Gregorian
  value, so form posts and Redmine's own JavaScript behave as before.
- Typed input accepts `1404/01/01`, `1404-1-1`, `۱۴۰۴/۰۱/۰۱`, or a Gregorian date
  such as `2025-03-21` (years >= 1700 are read as Gregorian).
- Optional Persian digits and configurable first day of the week.

## Installation

Plugin layout:

```
redmine_jalali/
├── init.rb
├── app/views/{redmine_jalali,settings}/
├── assets/{javascripts,stylesheets}/
├── config/locales/{fa,en}.yml
├── lib/redmine_jalali/{converter,formatter,parser,hooks}.rb
│   └── patches/i18n_patch.rb
└── test/converter_test.rb
```

### Docker

```
redmine/
├── docker-compose.yml
└── plugins/
    └── redmine_jalali/
```

```yaml
services:
  redmine:
    image: redmine:7.0.1-alpine
    volumes:
      - ./plugins/redmine_jalali:/usr/src/redmine/plugins/redmine_jalali:ro
```

```bash
docker compose up -d --force-recreate redmine
```

### Without Docker

Copy the folder to `<redmine>/plugins/redmine_jalali` and restart Redmine.
No `rake redmine:plugins:migrate` is needed.

## Usage

1. Set your account language to Persian (My account → Language).
2. Dates now appear as Jalali and date fields use the Jalali picker.

Configuration: Administration → Plugins → Redmine Jalali → Configure

| Setting | Default | Description |
|---|---|---|
| Locales using the Jalali calendar | `fa` | Comma-separated locale codes, e.g. `fa,en` |
| Use Persian digits | off | Show ۱۴۰۴/۰۱/۰۱ instead of 1404/01/01 |
| First day of the week | Saturday | Used by the date picker |

Date format comes from Administration → Settings → Display. Supported
directives: `%Y %y %m %d %e %B %b %A %a` (flags `-`, `_`, `0`).

## Verify the install

```bash
docker exec redmine-7-redmine-1 bundle exec rails runner '
I18n.locale = :fa
include Redmine::I18n
puts format_date(Date.new(2025,3,21))   # => 1404/01/01
'
```

The asset URL should return 200:

```bash
curl -I http://localhost:3000/plugin_assets/redmine_jalali/javascripts/jalali.js
```

If Jalali formatting ever fails, Redmine falls back to Gregorian and logs a line
starting with `[redmine_jalali]`.

## How it works

- `lib/redmine_jalali/patches/i18n_patch.rb` redefines `Redmine::I18n#format_date`
  in place when the plugin loads, so all existing helpers use it.
- `app/views/redmine_jalali/_head.html.erb` (hook `view_layouts_base_html_head`)
  adds the JS/CSS and a `<meta name="redmine-jalali">` tag with the configuration.
- `redmine_jalali.js` pairs each date input with a visible Jalali field and keeps
  the hidden original in sync, including inputs Redmine adds dynamically.

## Limitations

- Calendar and Gantt grids and charts still use Gregorian months.
- The date-format preview in Administration → Settings → Display is Gregorian.
- The converter uses the 33-year arithmetic algorithm. It matches the astronomical
  calendar for 1900-2123 (Jalali 1279-1502) and may differ by a day after that.
- Date changes made by other scripts without a `change` event show in the Jalali
  field only after it gets focus.

## Tests

```bash
ruby -Ilib test/converter_test.rb
```

## Uninstall

Remove the plugin folder (or the compose volume line) and restart Redmine.
Nothing needs to be rolled back, since no data was changed.
