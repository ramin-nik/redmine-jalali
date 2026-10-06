# frozen_string_literal: true

module RedmineJalali
  module Patches
    # Redefines Redmine::I18n#format_date in place (alias + redefine) instead of
    # prepending a module, so every class/helper that already includes
    # Redmine::I18n sees the change immediately. format_time calls format_date,
    # so timestamps follow. The REST API does not use format_date (stays ISO).
    module I18nPatch
      def self.apply!
        target = ::Redmine::I18n
        return false if target.method_defined?(:format_date_without_jalali)

        target.module_eval do
          alias_method :format_date_without_jalali, :format_date

          def format_date(date)
            return format_date_without_jalali(date) unless RedmineJalali.active?
            return nil unless date

            RedmineJalali::Formatter.format_date(date.to_date)
          rescue StandardError => e
            Rails.logger.warn("[redmine_jalali] format_date fallback: #{e.class}: #{e.message}")
            format_date_without_jalali(date)
          end
        end
        true
      end
    end
  end
end
