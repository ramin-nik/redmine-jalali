# frozen_string_literal: true

module RedmineJalali
  module Formatter
    FA_MONTHS = %w[فروردین اردیبهشت خرداد تیر مرداد شهریور مهر آبان آذر دی بهمن اسفند].freeze
    # Indexed by Date#wday (0 = Sunday)
    FA_DAYS = %w[یکشنبه دوشنبه سه‌شنبه چهارشنبه پنجشنبه جمعه شنبه].freeze
    PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

    module_function

    def month_names
      names = ::I18n.t('redmine_jalali.month_names', default: '')
      names.is_a?(Array) && names.size == 12 ? names : FA_MONTHS
    end

    def day_names
      names = ::I18n.t('redmine_jalali.day_names', default: '')
      names.is_a?(Array) && names.size == 7 ? names : FA_DAYS
    end

    def to_persian_digits(str)
      str.to_s.tr('0123456789', PERSIAN_DIGITS)
    end

    # Formats a Gregorian Date as Jalali using a strftime-like format.
    # Supported: %Y %y %m %d %e %B %b %A %a %% (flags: - _ 0)
    def format_date(date, format = nil)
      fmt = format || Setting.date_format.presence || ::I18n.t('date.formats.default', default: '%Y/%m/%d')
      fmt = ::I18n.t("date.formats.#{fmt}", default: '%Y/%m/%d') if fmt.is_a?(Symbol)

      jy, jm, jd = Converter.gregorian_to_jalali(date)
      months = month_names
      days = day_names

      out = fmt.to_s.gsub(/%([-_0^]?)([YymdeBbAa%])/) do
        flag = Regexp.last_match(1)
        case Regexp.last_match(2)
        when 'Y' then jy.to_s
        when 'y' then pad(jy % 100, 2, flag, '0')
        when 'm' then pad(jm, 2, flag, '0')
        when 'd' then pad(jd, 2, flag, '0')
        when 'e' then pad(jd, 2, flag, ' ')
        when 'B', 'b' then months[jm - 1]
        when 'A', 'a' then days[date.wday]
        when '%' then '%'
        end
      end

      RedmineJalali.persian_digits? ? to_persian_digits(out) : out
    end

    def pad(number, width, flag, default_pad)
      return number.to_s if flag == '-'

      pad_char = case flag
                 when '_' then ' '
                 when '0' then '0'
                 else default_pad
                 end
      number.to_s.rjust(width, pad_char)
    end
  end
end
