# frozen_string_literal: true

module RedmineJalali
  module Patches
    # The CSV export writes dates through format_date, so they are Jalali. Without
    # this patch, importing that file back read 1404/01/01 as the Gregorian year 1404.
    # Jalali cells (year < 1700) are converted here; anything else goes to Redmine.
    module ImportPatch
      def self.apply!
        return false if ::Import < self

        ::Import.prepend(self)
        true
      end

      def row_date(row, key)
        if (s = row_value(row, key))
          format = settings['date_format']
          format = ::Import::DATE_FORMATS.first unless ::Import::DATE_FORMATS.include?(format)
          date = RedmineJalali::Parser.parse_import_date(s, format)
          return date if date.is_a?(Date)
          # Hand back the raw text, as Redmine does, so the row fails with "is not a valid date".
          return s if date == :invalid
        end
        super
      end
    end
  end
end
