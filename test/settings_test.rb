# frozen_string_literal: true

# Standalone test (no Redmine needed):  ruby -Ilib test/settings_test.rb
require 'minitest/autorun'

# Minimal stand-ins for the Redmine classes the plugin touches when it is loaded.
module Redmine
  module Hook
    class ViewListener
      def self.render_on(*); end
    end
  end
end
class Setting
  class << self
    attr_accessor :plugin_redmine_jalali
  end
end
require 'redmine_jalali'

class SettingsTest < Minitest::Test
  def with_settings(hash)
    Setting.plugin_redmine_jalali = hash
    yield
  ensure
    Setting.plugin_redmine_jalali = nil
  end

  def test_defaults_when_nothing_is_stored
    with_settings(nil) do
      assert RedmineJalali.active?(:fa)
      refute RedmineJalali.active?(:en)
      assert_equal 6, RedmineJalali.week_start
    end
  end

  def test_empty_locale_list_turns_jalali_off
    with_settings('enabled_locales' => '', 'persian_digits' => '0', 'week_start' => '6') do
      refute RedmineJalali.active?(:fa)
      refute RedmineJalali.active?(:en)
    end
  end

  def test_listed_locales_are_active
    with_settings('enabled_locales' => 'fa, EN') do
      assert RedmineJalali.active?(:fa)
      assert RedmineJalali.active?(:en)
    end
  end

  def test_missing_or_blank_values_keep_working
    with_settings('enabled_locales' => 'fa', 'week_start' => '') do
      assert_equal 6, RedmineJalali.week_start
      refute RedmineJalali.persian_digits?
    end
    with_settings(enabled_locales: 'en', persian_digits: '1') do # symbol keys
      assert RedmineJalali.active?(:en)
      assert RedmineJalali.persian_digits?
    end
  end
end
