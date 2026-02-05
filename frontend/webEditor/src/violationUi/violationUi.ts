import { injectable } from "inversify";
import "./violationUi.css";
import { AccordionUiExtension } from "../accordionUiExtension";

@injectable()
export class ViolationUI extends AccordionUiExtension {
    static readonly ID = "violation-ui";

    constructor() {
        super("left", "up");
    }

    id() {
        return ViolationUI.ID;
    }

    containerClass() {
        return ViolationUI.ID;
    }

    protected initializeHeaderContent(headerElement: HTMLElement) {
        headerElement.innerText = "Violation Summary";
    }

    protected initializeHidableContent(contentElement: HTMLElement) {
        contentElement.innerHTML = `
            <div class="violation-tabs">
                <button class="tab-btn active" data-tab="simple">Simple</button>
                <button class="tab-btn" data-tab="ai">AI Generated</button>
            </div>
            <div class="violation-content">
                <div id="simple-summary" class="tab-pane active">
                    <div class="summary-text">
                        <p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
                    </div>
                </div>

                <div id="ai-summary" class="tab-pane">
                    <div class="api-key-container">
                        <label for="ai-api-key">OpenAI API Key:</label>
                        <input type="password" id="ai-api-key" placeholder="Your API Key" />
                    </div>
                    <div class="summary-text">
                        <p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>
                    </div>
                </div>
            </div>

            <div class="violation-actions">
                <button id="generate-btn" class="primary-btn">
                    <i class="fas fa-sync-alt"></i> Generate
                </button>
            </div>
        `;

        this.setupTabLogic(contentElement);
        this.setupGenerateLogic(contentElement);
    }

    private setupGenerateLogic(container: HTMLElement) {
        const generateBtn = container.querySelector("#generate-btn") as HTMLButtonElement;

        generateBtn.addEventListener("click", () => {
            const activeTab = container.querySelector(".tab-btn.active")?.getAttribute("data-tab");

            if (activeTab === "ai") {
                // Hier Logik für AI Call
                // const apiKey = (container.querySelector("#ai-api-key") as HTMLInputElement)?.value;
            } else {
                // Hier Logik für Simple Summary
            }
        });
    }

    private setupTabLogic(container: HTMLElement) {
        const buttons = container.querySelectorAll(".tab-btn");
        const panes = container.querySelectorAll(".tab-pane");

        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const target = btn.getAttribute("data-tab");

                buttons.forEach((b) => b.classList.remove("active"));
                panes.forEach((p) => p.classList.remove("active"));

                btn.classList.add("active");
                container.querySelector(`#${target}-summary`)?.classList.add("active");
            });
        });
    }
}
