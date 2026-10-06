# frozen_string_literal: true

require 'date'

module RedmineJalali
  # Gregorian <-> Jalali conversion (algorithm of Borkowski, as used by jalaali-js).
  # Valid for Jalali years -61..3176. Integer arithmetic only.
  module Converter
    BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635,
              2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178].freeze

    module_function

    # Integer division truncating toward zero (like JS ~~(a/b)); the algorithm relies on it.
    def div(a, b)
      q = a.abs / b.abs
      (a < 0) ^ (b < 0) ? -q : q
    end

    # Remainder matching truncated division.
    def mod(a, b)
      a - b * div(a, b)
    end

    def jal_cal(jy, without_leap = false)
      bl = BREAKS.length
      gy = jy + 621
      leap_j = -14
      jp = BREAKS[0]
      raise ArgumentError, "Invalid Jalali year #{jy}" if jy < jp || jy >= BREAKS[bl - 1]

      jump = 0
      (1...bl).each do |i|
        jm = BREAKS[i]
        jump = jm - jp
        break if jy < jm

        leap_j += div(jump, 33) * 8 + div(mod(jump, 33), 4)
        jp = jm
      end
      n = jy - jp
      leap_j += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
      leap_j += 1 if mod(jump, 33) == 4 && jump - n == 4

      leap_g = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
      march = 20 + leap_j - leap_g
      return { gy: gy, march: march } if without_leap

      n = n - jump + div(jump + 4, 33) * 33 if jump - n < 6
      leap = mod(mod(n + 1, 33) - 1, 4)
      leap = 4 if leap == -1
      { leap: leap, gy: gy, march: march }
    end

    def g2d(gy, gm, gd)
      d = div((gy + div(gm - 8, 6) + 100_100) * 1461, 4) +
          div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34_840_408
      d - div(div(gy + 100_100 + div(gm - 8, 6), 100) * 3, 4) + 752
    end

    def d2g(jdn)
      j = 4 * jdn + 139_361_631
      j += div(div(4 * jdn + 183_187_720, 146_097) * 3, 4) * 4 - 3908
      i = div(mod(j, 1461), 4) * 5 + 308
      gd = div(mod(i, 153), 5) + 1
      gm = mod(div(i, 153), 12) + 1
      gy = div(j, 1461) - 100_100 + div(8 - gm, 6)
      [gy, gm, gd]
    end

    def j2d(jy, jm, jd)
      r = jal_cal(jy, true)
      g2d(r[:gy], 3, r[:march]) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
    end

    def d2j(jdn)
      gy = d2g(jdn)[0]
      jy = gy - 621
      r = jal_cal(jy)
      jdn1f = g2d(gy, 3, r[:march])
      k = jdn - jdn1f
      if k >= 0
        if k <= 185
          return [jy, 1 + div(k, 31), mod(k, 31) + 1]
        else
          k -= 186
        end
      else
        jy -= 1
        k += 179
        k += 1 if r[:leap] == 1
      end
      [jy, 7 + div(k, 30), mod(k, 30) + 1]
    end

    # ---- public API -------------------------------------------------

    # Date => [jy, jm, jd]
    def gregorian_to_jalali(date)
      d2j(g2d(date.year, date.month, date.day))
    end

    # (jy, jm, jd) => Date. Raises ArgumentError when invalid.
    def jalali_to_gregorian(jy, jm, jd)
      raise ArgumentError, "Invalid Jalali date #{jy}/#{jm}/#{jd}" unless valid?(jy, jm, jd)

      gy, gm, gd = d2g(j2d(jy, jm, jd))
      Date.new(gy, gm, gd)
    end

    def leap?(jy)
      jal_cal(jy)[:leap].zero?
    end

    # Esfand has 30 days in a leap year, 29 otherwise.
    def month_length(jy, jm)
      return 31 if jm <= 6
      return 30 if jm <= 11

      leap?(jy) ? 30 : 29
    end

    def valid?(jy, jm, jd)
      return false unless jy.is_a?(Integer) && jm.is_a?(Integer) && jd.is_a?(Integer)
      return false if jy < -61 || jy > 3176 || jm < 1 || jm > 12 || jd < 1

      jd <= month_length(jy, jm)
    end
  end
end
