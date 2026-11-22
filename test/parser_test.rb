# frozen_string_literal: true

# Standalone test (no Redmine needed):  ruby -Ilib test/parser_test.rb
require 'minitest/autorun'
require 'redmine_jalali/converter'
require 'redmine_jalali/parser'

class ParserTest < Minitest::Test
  P = RedmineJalali::Parser
  # Same list as Redmine's Import::DATE_FORMATS.
  FORMATS = {
    '%Y-%m-%d' => '1404-01-01', '%d/%m/%Y' => '01/01/1404', '%m/%d/%Y' => '01/01/1404',
    '%Y/%m/%d' => '1404/01/01', '%d.%m.%Y' => '01.01.1404', '%d-%m-%Y' => '01-01-1404'
  }.freeze

  def test_import_date_in_every_redmine_format
    FORMATS.each do |format, cell|
      assert_equal Date.new(2025, 3, 21), P.parse_import_date(cell, format), format
    end
  end

  def test_import_date_field_order_and_short_numbers
    assert_equal Date.new(2025, 5, 21), P.parse_import_date('1404/2/31', '%Y/%m/%d') # Ordibehesht 31
    assert_equal Date.new(2025, 5, 21), P.parse_import_date('31/02/1404', '%d/%m/%Y')
    assert_equal Date.new(2025, 5, 21), P.parse_import_date('02/31/1404', '%m/%d/%Y')
  end

  def test_import_date_persian_and_arabic_digits
    assert_equal Date.new(2025, 3, 21), P.parse_import_date('۱۴۰۴-۰۱-۰۱', '%Y-%m-%d')
    assert_equal Date.new(2025, 3, 21), P.parse_import_date('١٤٠٤/٠١/٠١', '%Y/%m/%d')
    assert_equal Date.new(2025, 3, 21), P.parse_import_date(' 1404-01-01 ', '%Y-%m-%d')
  end

  def test_import_date_leap_year
    assert_equal Date.new(2025, 3, 20), P.parse_import_date('1403/12/30', '%Y/%m/%d') # 1403 is leap
    assert_equal :invalid, P.parse_import_date('1404/12/30', '%Y/%m/%d')              # 1404 is not
    assert_equal :invalid, P.parse_import_date('1404/13/01', '%Y/%m/%d')
  end

  def test_import_date_leaves_gregorian_and_other_text_to_redmine
    assert_nil P.parse_import_date('2025-03-21', '%Y-%m-%d')
    assert_nil P.parse_import_date('1404/01/01', '%Y-%m-%d') # separator does not match the format
    assert_nil P.parse_import_date('not a date', '%Y-%m-%d')
    assert_nil P.parse_import_date('1404-01-01', '%Y-%m')    # format without a day
  end
end
