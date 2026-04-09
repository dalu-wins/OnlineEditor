import { injectable, inject } from "inversify";
import { ViolationService } from "./violationService";
import "./violationUi.css";
import { AccordionUiExtension } from "../accordionUiExtension";
import { Violation } from "./Violation";
import { ConstraintMenu } from "../constraint/ConstraintMenu";
import { Theme, ThemeManager } from "../settings/Theme";
import { SETTINGS } from "../settings/Settings";

const EXPLAINER_API_URL = import.meta.env.VITE_EXPLAINER_API_URL;
const EXPLAINER_API_KEY = import.meta.env.VITE_EXPLAINER_API_KEY;

@injectable()
export class ViolationUI extends AccordionUiExtension {
    static readonly ID = "violation-ui";

    private violations: Violation[] = [];
    private selectedIndex = -1;
    private contentElement: HTMLElement | null = null;
    private detailPane: HTMLElement | null = null;

    private summaryCache: Map<number, { constraint_explanation: string; violation_explanation: string; tfg_context: string; provider: string }> = new Map();

    constructor(
        @inject(ViolationService) private violationService: ViolationService,
        @inject(ConstraintMenu) private constraintMenu: ConstraintMenu,
        @inject(SETTINGS.Theme) private themeManager: ThemeManager,
    ) {
        super("left", "up");
    }

    id() { return ViolationUI.ID; }
    containerClass() { return ViolationUI.ID; }

    protected initializeHeaderContent(headerElement: HTMLElement) {
        headerElement.innerText = "AI Summary";
    }

    protected initializeHidableContent(contentElement: HTMLElement) {
        this.contentElement = contentElement;

        const grid = document.createElement("div");
        grid.classList.add("violation-content");
        contentElement.appendChild(grid);

        this.addStatusInfo(grid, "No violation data found. Run an Analysis first.");

        this.themeManager.registerListener(() => this.applyTheme());

        this.violationService.onViolationsChanged((violations) => {
            this.violations = violations;
            this.selectedIndex = -1;
            this.updateViolations(grid);
        });
    }

    private updateViolations(container: HTMLElement) {
        container.innerHTML = "";
        this.summaryCache.clear();

        if (this.violations.length === 0) {
            this.addStatusInfo(container, "No violations found. Everything looks good!");
            return;
        }

        this.open();
        this.constraintMenu.collapse();

        this.addDropDown(
            container,
            `Found ${this.violations.length} violation${this.violations.length > 1 ? "s" : ""}`,
            this.violations.map((v, i) => {
                const label = v.constraint.split(":")[0].replace(/^-\s*/, "").trim();
                return { label: `${i + 1}. ${label}`, value: i };
            }),
            (index) => {
                this.selectedIndex = index;
                this.renderSelected();
            },
        );

        this.detailPane = document.createElement("div");
        this.detailPane.classList.add("violation-detail-pane");
        container.appendChild(this.detailPane);
    }

    private async renderSelected() {
        if (!this.detailPane) return;

        const currentViolation = this.violations[this.selectedIndex];
        if (!currentViolation) return;

        // 1. Pane leeren
        this.detailPane.innerHTML = "";

        // 2. Cache prüfen oder laden
        let s = this.summaryCache.get(this.selectedIndex);
        if (!s) {
            this.addStatusInfo(this.detailPane, "Analyzing...");
            s = await this.fetchAiSummary(currentViolation);
            this.summaryCache.set(this.selectedIndex, s);
            
            // WICHTIG: Erneut leeren, um "Analyzing..." zu entfernen
            this.detailPane.innerHTML = "";
        }

        // 3. Content rendern (Wichtig: Übergabe von currentViolation)
        const constraintItem = document.createElement("div");
        constraintItem.classList.add("violation-item");
        this.addContent(constraintItem, "Constraint", s.constraint_explanation, currentViolation);
        this.detailPane.appendChild(constraintItem);

        const violationItem = document.createElement("div");
        violationItem.classList.add("violation-item");
        this.addContent(violationItem, "Violation", s.violation_explanation, currentViolation);
        this.detailPane.appendChild(violationItem);

        this.applyTheme();
        this.addLegend(this.detailPane);
    }

    private addContent(container: HTMLElement, label: string, text: string, violation: Violation): void {
        const labelEl = document.createElement("p");
        labelEl.classList.add("violation-section-label");
        labelEl.textContent = label;

        const textEl = document.createElement("p");
        textEl.classList.add(`violation-${label.toLowerCase()}-explanation`);

        // Umbrüche entfernen für flüssigen Text
        const cleanText = text.replace(/\n/g, " ");
        const parts = cleanText.split(/(`[^`]+`)/g);

        parts.forEach(part => {
            if (part.startsWith('`') && part.endsWith('`')) {
                const content = part.slice(1, -1);
                const span = document.createElement("span");
                span.classList.add("violation-text-highlight");

                // Logik-Check für Klassen
                const isTfg = violation.tfg.some(t => t.includes(content) || content.includes(t));
                const isConstraint = violation.constraint.includes(content) || content.includes(violation.constraint);
                if (isTfg) {
                    span.classList.add("tfg-match");
                } else if (isConstraint) {
                    span.classList.add("constraint-match");
                }

                span.textContent = content;
                textEl.appendChild(span);
            } else if (part.length > 0) {
                textEl.appendChild(document.createTextNode(part));
            }
        });

        container.appendChild(labelEl);
        container.appendChild(textEl);
    }

    private addDropDown(
        container: HTMLElement,
        label: string,
        options: { label: string; value: number }[],
        onChange: (value: number) => void,
    ): HTMLSelectElement {
        const row = document.createElement("div");
        row.classList.add("violation-select-row");

        const textLabel = document.createElement("span");
        textLabel.classList.add("violation-select-label");
        textLabel.textContent = label;

        const select = document.createElement("select");
        select.classList.add("violation-select");

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.disabled = true;
        placeholder.selected = true;
        placeholder.textContent = "— select —";
        select.appendChild(placeholder);

        for (const opt of options) {
            const option = document.createElement("option");
            option.value = opt.value.toString();
            option.textContent = opt.label;
            select.appendChild(option);
        }

        select.onchange = () => onChange(parseInt(select.value));

        row.appendChild(textLabel);
        row.appendChild(select);
        container.appendChild(row);

        return select;
    }


    private addLegend(container: HTMLElement): void {
        const legendContainer = document.createElement("div");
        legendContainer.classList.add("violation-legend");

        const items = [
            { label: "Part of Constraint", class: "constraint-match" },
            { label: "Vertex Name", class: "tfg-match" }
        ];

        items.forEach(item => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("legend-item");

            const box = document.createElement("span");
            box.classList.add("violation-text-highlight", item.class);
            box.style.marginRight = "6px";
            box.style.borderWidth = "1px"; // Sicherstellen, dass der Rahmen sichtbar ist
            box.textContent = "abc"; // Beispieltext für die Box

            const text = document.createElement("span");
            text.textContent = item.label;

            wrapper.appendChild(box);
            wrapper.appendChild(text);
            legendContainer.appendChild(wrapper);
        });

        container.appendChild(legendContainer);
    }


    private addStatusInfo(container: HTMLElement, message: string): void {
        const p = document.createElement("p");
        p.classList.add("status-info");
        p.textContent = message;
        container.appendChild(p);
    }

    private applyTheme(): void {
        if (!this.contentElement) return;
        const isDark = this.themeManager.getTheme() === Theme.DARK;
        this.contentElement.querySelectorAll<HTMLElement>(".violation-item").forEach((el) => {
            el.style.background = isDark ? "#1e1e1e" : "#f0f0f0";
            el.style.borderColor = isDark ? "#444" : "#ccc";
        });
    }

    private async fetchAiSummary(v: Violation): Promise<{ constraint_explanation: string; violation_explanation: string; tfg_context: string; provider: string }> {
        try {
            const response = await fetch(EXPLAINER_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": EXPLAINER_API_KEY,
                },
                body: JSON.stringify({
                    constraint: v.constraint,
                    violated_vertex: v.violatedVertices,
                    inducing_vertex: v.inducingVertices,
                    tfg: v.tfg,
                }),
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (err) {
            console.error("AI summary fetch failed:", err);
            return {
                constraint_explanation: "Could not load explanation.",
                violation_explanation: "Could not load explanation.",
                tfg_context: "",
                provider: "error",
            };
        }
    }
}