# frozen_string_literal: true

module RedmineJalali
  # Parses user-typed dates. Accepts Latin, Persian and Arabic-Indic digits and
  # the separators / - .  A year >= 1700 is treated as an already-Gregorian date,
  # anything lower as Jalali (so 1404/01/01 and 2025-03-21 both work).
  module Parser
    PERSIAN = '۰۱۲۳۴۵۶۷۸۹'
    ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'

    module_function

    def normalize_digits(str)
      str.to_s.tr(PERSIAN, '0123456789').tr(ARABIC_INDIC, '0123456789')
    end

    # => Date (Gregorian) or nil
    def parse(str)
      m = normalize_digits(str).strip.match(%r{\A(\d{3,4})[/\-.](\d{1,2})[/\-.](\d{1,2})\z})
      return nil unless m

      y, mo, d = m[1].to_i, m[2].to_i, m[3].to_i
      y >= 1700 ? Date.new(y, mo, d) : Converter.jalali_to_gregorian(y, mo, d)
    rescue ArgumentError
      nil
    end

    # Reads a CSV import cell written in an strftime format made of %Y, %m, %d and
    # separators (Redmine's Import::DATE_FORMATS). Returns:
    #   a Date      when the cell holds a valid Jalali date (year < 1700),
    #   :invalid    when it holds a Jalali year but the date does not exist,
    #   nil         when it is not a Jalali date, so Redmine's own parsing applies.
    def parse_import_date(str, format)
      order = []
      pattern = Regexp.escape(format.to_s).gsub(/%([Ymd])/) do
        order << Regexp.last_match(1)
        Regexp.last_match(1) == 'Y' ? '(\d{3,4})' : '(\d{1,2})'
      end
      return nil unless order.sort == %w[Y d m]

      m = normalize_digits(str).strip.match(/\A#{pattern}\z/)
      return nil unless m

      parts = order.zip(m.captures.map(&:to_i)).to_h
      return nil if parts['Y'] >= 1700

      Converter.jalali_to_gregorian(parts['Y'], parts['m'], parts['d'])
    rescue ArgumentError
      :invalid
    end
  end
end
