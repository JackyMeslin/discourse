import I18n from "I18n";
import { createWidget } from "discourse/widgets/widget";
import { get } from "@ember/object";
import { h } from "virtual-dom";
import { searchContextDescription } from "discourse/lib/search";

createWidget("search-term", {
  tagName: "input",
  buildId: () => "search-term",
  buildKey: () => "search-term",

  defaultState() {
    return { afterAutocomplete: false };
  },

  buildAttributes(attrs) {
    return {
      type: "text",
      value: attrs.value || "",
      autocomplete: "discourse",
      placeholder: attrs.contextEnabled ? "" : I18n.t("search.title"),
      "aria-label": I18n.t("search.title"),
    };
  },

  keyUp(e) {
    if (e.key === "Enter" && !this.state.afterAutocomplete) {
      return this.sendWidgetAction("fullSearch");
    }
  },

  input(e) {
    const val = this.attrs.value;

    // remove zero-width chars
    const newVal = e.target.value.replace(/[\u200B-\u200D\uFEFF]/, "");

    if (newVal !== val) {
      this.sendWidgetAction("searchTermChanged", newVal);
    }
  },
});

createWidget("search-context", {
  tagName: "div.search-context",

  html(attrs) {
    const service = this.register.lookup("search-service:main");
    const ctx = service.get("searchContext");

    const result = [];
    if (ctx) {
      const description = searchContextDescription(
        get(ctx, "type"),
        get(ctx, "user.username") ||
          get(ctx, "category.name") ||
          get(ctx, "tag.id")
      );
      result.push(
        h("label", [
          h("input", { type: "checkbox", checked: attrs.contextEnabled }),
          " ",
          description,
        ])
      );
    }

    if (!attrs.contextEnabled) {
      result.push(
        this.attach("link", {
          href: attrs.url,
          label: "show_help",
          className: "show-help",
        })
      );
    }

    return result;
  },

  click() {
    const val = $(".search-context input").is(":checked");
    if (val !== this.attrs.contextEnabled) {
      this.sendWidgetAction("searchContextChanged", val);
    }
  },
});
