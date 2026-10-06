# frozen_string_literal: true

# Standalone test (no Redmine needed):  ruby -Ilib test/converter_test.rb
require 'minitest/autorun'
require 'redmine_jalali/converter'

class ConverterTest < Minitest::Test
  C = RedmineJalali::Converter

  def test_known_dates
    assert_equal [1403, 1, 1],  C.gregorian_to_jalali(Date.new(2024, 3, 20))
    assert_equal [1404, 1, 1],  C.gregorian_to_jalali(Date.new(2025, 3, 21))
    assert_equal [1403, 12, 30], C.gregorian_to_jalali(Date.new(2025, 3, 20)) # 1403 is leap
    assert_equal Date.new(2025, 3, 21), C.jalali_to_gregorian(1404, 1, 1)
  end

  def test_round_trip
    (Date.new(1900, 1, 1)..Date.new(2200, 12, 31)).each do |d|
      assert_equal d, C.jalali_to_gregorian(*C.gregorian_to_jalali(d))
    end
  end

  def test_validation
    refute C.valid?(1404, 12, 30) # 1404 is not leap
    assert C.valid?(1403, 12, 30)
    refute C.valid?(1404, 13, 1)
  end
end
