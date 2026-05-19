/*
 * creedengo JavaScript plugin - Provides rules to reduce the environmental footprint of your JavaScript programs
 * Copyright © 2023 Green Code Initiative (https://green-code-initiative.org)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Avoid autoplay for videos and audio content",
      category: "eco-design",
      recommended: "warn",
    },
    messages: {
      NoAutoplay: "Avoid autoplay for video and audio elements.",
      EnforcePreloadNone: "Set preload='none' for video and audio elements.",
      NoAutoplayAndEnforcePreloadNone:
        "Avoid autoplay and set preload='none' for video and audio elements.",
    },
    schema: [],
  },
    create(context) {
    const reportAutoplay = (autoplayAttr, preloadAttr, preloadValue, fallback) => {
      if (autoplayAttr && preloadValue !== "none") {
        context.report({
          node: autoplayAttr || preloadAttr,
          messageId: "NoAutoplayAndEnforcePreloadNone",
        });
        return;
      }

      if (autoplayAttr) {
        context.report({
          node: autoplayAttr,
          messageId: "NoAutoplay",
        });
      }

      if (!preloadAttr || preloadValue !== "none") {
        context.report({
          node: preloadAttr || fallback,
          messageId: "EnforcePreloadNone",
        });
      }
    };

    const parserServices = context.parserServices || context.sourceCode?.parserServices;

    const vueTemplateVisitor = parserServices?.defineTemplateBodyVisitor
      ? parserServices.defineTemplateBodyVisitor({
          VElement(node) {
            const rawName =
              typeof node.name === "string" ? node.name : node.name?.name || node.rawName;
            const name = rawName?.toLowerCase();
            if (name !== "video" && name !== "audio") return;

            const getAttr = (attrName) =>
              node.startTag.attributes.find(
                (attr) =>
                  attr.type === "VAttribute" &&
                  attr.key?.name?.toLowerCase() === attrName,
              );

            const autoplayAttr = getAttr("autoplay");
            const preloadAttr = getAttr("preload");
            const preloadValue = preloadAttr?.value?.value;

            reportAutoplay(autoplayAttr, preloadAttr, preloadValue, node);
          },
        })
      : {};

    return {
      JSXOpeningElement(node) {
        if (node.name.name === "video" || node.name.name === "audio") {
          const autoplayAttr = node.attributes.find(
            (attr) => attr.name?.name.toLowerCase() === "autoplay",
          );
          const preloadAttr = node.attributes.find(
            (attr) => attr.name?.name.toLowerCase() === "preload",
          );
          const preloadValue = preloadAttr?.value?.value;

          reportAutoplay(autoplayAttr, preloadAttr, preloadValue, node);
        }
      },
      ...vueTemplateVisitor,
    };
  },
};
