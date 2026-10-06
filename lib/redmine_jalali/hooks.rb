# frozen_string_literal: true

module RedmineJalali
  class Hooks < Redmine::Hook::ViewListener
    render_on :view_layouts_base_html_head, partial: 'redmine_jalali/head'
  end
end
