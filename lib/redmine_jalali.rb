# frozen_string_literal: true

require 'date'

module RedmineJalali
  DEFAULT_SETTINGS = {
    'enabled_locales' => 'fa', # Jalali is used when the current locale is in this list
    'persian_digits'  => '0',  # '1' => render ۱۴۰۴/۰۱/۰۱ instead of 1404/01/01
    'week_start'      => '6'   # 0 = Sunday ... 6 = Saturday
  }.freeze

  class << self
    # format_date calls this for every date it renders, so the parsed result is kept
    # until Redmine's settings cache hands back a different object (i.e. on a change).
    def settings
      config[:settings]
    end

    def enabled_locales
      config[:locales]
    end

    # True when dates should be shown/entered as Jalali for the given locale.
    def active?(locale = ::I18n.locale)
      enabled_locales.include?(locale.to_s.downcase)
    end

    def persian_digits?
      config[:persian_digits]
    end

    def week_start
      Integer(settings['week_start'].to_s, 10) % 7
    rescue ArgumentError
      6
    end

    private

    def config
      stored = begin
        Setting.plugin_redmine_jalali
      rescue StandardError
        nil
      end
      cached = @config
      return cached[:value] if cached && cached[:stored].equal?(stored)

      cleaned = (stored || {}).to_h.transform_keys(&:to_s).reject { |_, v| v.to_s.strip.empty? }
      merged = DEFAULT_SETTINGS.merge(cleaned).freeze
      value = {
        settings: merged,
        locales: merged['enabled_locales'].to_s.split(/[\s,;]+/).map(&:downcase).freeze,
        persian_digits: merged['persian_digits'].to_s == '1'
      }.freeze
      @config = { stored: stored, value: value }
      value
    end
  end
end

require_relative 'redmine_jalali/converter'
require_relative 'redmine_jalali/formatter'
require_relative 'redmine_jalali/parser'
require_relative 'redmine_jalali/patches/i18n_patch'
require_relative 'redmine_jalali/hooks'
