# frozen_string_literal: true

require_relative 'lib/redmine_jalali'

Redmine::Plugin.register :redmine_jalali do
  name 'Redmine Jalali'
  author 'Redmine Jalali'
  description 'Jalali (Persian/Solar Hijri) calendar for Redmine. Display and input only; ' \
              'the database and the REST API keep using Gregorian dates.'
  version '0.1.1'
  requires_redmine version_or_higher: '5.0.0'

  settings default: RedmineJalali::DEFAULT_SETTINGS.dup,
           partial: 'settings/redmine_jalali'
end

# Apply immediately (Redmine::I18n lives in lib/ and is not reloaded)...
RedmineJalali::Patches::I18nPatch.apply!
# ...and again after initialization as a safety net (idempotent).
Rails.configuration.to_prepare do
  RedmineJalali::Patches::I18nPatch.apply!
end
