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
  end
end
