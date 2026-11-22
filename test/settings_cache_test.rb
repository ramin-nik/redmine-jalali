# frozen_string_literal: true

# Standalone test (no Redmine needed):  ruby -Ilib test/settings_cache_test.rb
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

class SettingsCacheTest < Minitest::Test
  def teardown
    Setting.plugin_redmine_jalali = nil
  end

  # Redmine's settings cache returns a new object after a change; the plugin must follow.
  def test_a_changed_setting_is_picked_up
    Setting.plugin_redmine_jalali = { 'enabled_locales' => 'fa', 'persian_digits' => '0' }
    assert RedmineJalali.active?(:fa)
    refute RedmineJalali.persian_digits?

    Setting.plugin_redmine_jalali = { 'enabled_locales' => 'en', 'persian_digits' => '1' }
    refute RedmineJalali.active?(:fa)
    assert RedmineJalali.active?(:en)
    assert RedmineJalali.persian_digits?
  end

  def test_same_object_reuses_the_parsed_settings
    Setting.plugin_redmine_jalali = { 'enabled_locales' => 'fa' }
    assert_same RedmineJalali.settings, RedmineJalali.settings
  end
end
