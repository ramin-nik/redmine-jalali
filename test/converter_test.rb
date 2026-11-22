# frozen_string_literal: true

# Standalone test (no Redmine needed):  ruby -Ilib test/converter_test.rb
require 'minitest/autorun'
require 'json'
require 'redmine_jalali/converter'

class ConverterTest < Minitest::Test
  C = RedmineJalali::Converter

  def test_known_dates
    assert_equal [1403, 1, 1],  C.gregorian_to_jalali(Date.new(2024, 3, 20))
    assert_equal [1404, 1, 1],  C.gregorian_to_jalali(Date.new(2025, 3, 21))
    assert_equal [1403, 12, 30], C.gregorian_to_jalali(Date.new(2025, 3, 20)) # 1403 is leap
    assert_equal Date.new(2025, 3, 21), C.jalali_to_gregorian(1404, 1, 1)
  end

  # Same fixture as test/js/jalali.test.js, so both converters stay in agreement.
  def test_shared_known_dates
    path = File.expand_path('fixtures/known_dates.json', __dir__)
    JSON.parse(File.read(path))['dates'].each do |g, jy, jm, jd|
      assert_equal [jy, jm, jd], C.gregorian_to_jalali(Date.iso8601(g)), g
      assert_equal Date.iso8601(g), C.jalali_to_gregorian(jy, jm, jd), "#{jy}/#{jm}/#{jd}"
    end
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
