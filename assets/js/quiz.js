(function () {
	'use strict';

	const SELECTOR = '.wsaq[data-config]';

	class SleepApneaQuiz {
		constructor(element) {
			this.element = element;
			this.config = this.readConfig();
			this.questions = this.config.questions || [];
			this.answers = {};
			this.currentIndex = 0;

			this.stage = this.element.querySelector('.wsaq__question-stage');
			this.answersPanel = this.element.querySelector('.wsaq__answers');
			this.flow = this.element.querySelector('.wsaq__flow');
			this.resultPanel = this.element.querySelector('.wsaq__result');
			this.topProgress = this.element.querySelector('.wsaq__top-progress');
			this.progressFill = this.element.querySelector('.wsaq__top-progress-fill');
			this.progressSteps = Array.from(this.element.querySelectorAll('.wsaq__progress-step'));
			this.progressText = this.element.querySelector('.wsaq__progress-text');
			this.backButton = this.element.querySelector('[data-action="back"]');
			this.nextButton = this.element.querySelector('[data-action="next"]');

			this.attachEvents();
			this.render();
		}

		readConfig() {
			try {
				return JSON.parse(this.element.dataset.config || '{}');
			} catch (error) {
				return {};
			}
		}

		attachEvents() {
			this.backButton.addEventListener('click', () => {
				if (this.currentIndex > 0) {
					this.currentIndex -= 1;
					this.hideResult();
					this.render();
				}
			});

			this.nextButton.addEventListener('click', () => {
				if (this.currentIndex < this.questions.length && this.hasAnswerForCurrentQuestion()) {
					this.currentIndex += 1;
					this.hideResult();
					this.render();
				}
			});

			this.progressSteps.forEach((step) => {
				step.addEventListener('click', () => {
					const targetIndex = Number(step.dataset.step);
					const maxReachableIndex = Math.min(this.currentIndex, this.questions.length - 1);

					if (Number.isNaN(targetIndex) || targetIndex > maxReachableIndex) {
						return;
					}

					this.currentIndex = targetIndex;
					this.hideResult();
					this.render();
				});
			});
		}

		render() {
			this.renderQuestion();
			this.renderAnswers();
			this.renderProgress();
			this.toggleActions();
		}

		renderQuestion() {
			const question = this.questions[this.currentIndex];

			if (!question) {
				this.nextButton.hidden = true;
				this.nextButton.disabled = true;
				this.stage.innerHTML = `
					<div class="wsaq__question">
						<h3 class="wsaq__question-headline">${this.escape(this.config.labels.completionKick)}</h3>
						<p class="wsaq__question-text">Wszystkie odpowiedzi zostały zapisane. Możesz wrócić do poprzedniego kroku albo sprawdzić wynik.</p>
						<div class="wsaq__completion-actions">
							<button type="button" class="wsaq__primary-button wsaq__primary-button--inline" data-action="submit-final">
								${this.escape(this.config.labels.checkResult)}
							</button>
						</div>
					</div>
				`;

				const submitFinalButton = this.stage.querySelector('[data-action="submit-final"]');
				if (submitFinalButton) {
					submitFinalButton.addEventListener('click', () => {
						const result = this.calculateResult();
						this.renderResult(result);
					});
				}

				return;
			}

			const answer = this.answers[question.id];
			const options = [
				{ value: true, label: this.config.labels.yes },
				{ value: false, label: this.config.labels.no },
			];

			this.stage.innerHTML = `
				<div class="wsaq__question" data-question-id="${this.escape(question.id)}">
					<span class="wsaq__question-tag">${this.escape(this.config.labels.questionTag)} ${this.currentIndex + 1}</span>
					<div>
						<h3 class="wsaq__question-headline">${this.escape(question.headline)}</h3>
						<p class="wsaq__question-text">${this.escape(question.text)}</p>
					</div>
					<div class="wsaq__options" role="group" aria-label="${this.escape(question.headline)}">
						${options
							.map(
								(option) => `
									<button
										type="button"
										class="wsaq__option ${answer === option.value ? 'is-active' : ''}"
										data-answer="${option.value ? '1' : '0'}"
									>
										${this.escape(option.label)}
									</button>
								`
							)
							.join('')}
					</div>
				</div>
			`;

			this.stage.querySelectorAll('.wsaq__option').forEach((button) => {
				button.addEventListener('click', () => {
					this.answers[question.id] = button.dataset.answer === '1';
					this.stage.querySelectorAll('.wsaq__option').forEach((option) => {
						option.classList.toggle('is-active', option === button);
					});
					this.hideResult();
					this.renderAnswers();
					this.toggleActions();
				});
			});
		}

		renderAnswers() {
			const answeredQuestions = this.questions.filter((question) => Object.prototype.hasOwnProperty.call(this.answers, question.id));

			if (!answeredQuestions.length) {
				this.answersPanel.innerHTML = '';
				return;
			}

			const items = answeredQuestions
				.map((question) => {
					const answer = this.answers[question.id] ? this.config.labels.yes : this.config.labels.no;

					return `
						<div class="wsaq__answer-item">
							<strong>${this.escape(question.headline)}</strong>
							<span class="wsaq__answer-badge">${this.escape(answer)}</span>
						</div>
					`;
				})
				.join('');

			this.answersPanel.innerHTML = `
				<h3 class="wsaq__answers-title">${this.escape(this.config.labels.summaryTitle)}</h3>
				<div class="wsaq__answers-list">
					${items}
				</div>
			`;
		}

		renderProgress() {
			const answeredCount = Object.keys(this.answers).length;
			const total = this.questions.length;
			const currentStep = Math.min(this.currentIndex + 1, total);
			const completedCount = Math.min(this.currentIndex, total);
			const progressValue = total ? (completedCount / total) * 100 : 0;

			if (this.progressText) {
				if (this.currentIndex >= total || this.element.classList.contains('is-showing-result')) {
					this.progressText.style.display = 'none';
				} else {
					this.progressText.style.display = '';
					this.progressText.textContent = `${this.config.labels.progressStep} ${currentStep} z ${total}`;
				}
			}

			if (this.topProgress) {
				this.topProgress.setAttribute('aria-valuenow', String(completedCount));
			}

			if (this.progressFill) {
				this.progressFill.style.width = `${progressValue}%`;
			}

			this.progressSteps.forEach((step, index) => {
				const isComplete = index < completedCount;
				const isCurrent = this.currentIndex < total && index === this.currentIndex;
				const isClickable = index <= Math.min(this.currentIndex, total - 1);

				step.classList.toggle('is-complete', isComplete);
				step.classList.toggle('is-current', isCurrent);
				step.disabled = !isClickable;
				step.setAttribute('aria-current', isCurrent ? 'step' : 'false');
			});
		}

		toggleActions() {
			const isCompletionStep = this.currentIndex >= this.questions.length;

			this.backButton.hidden = false;
			this.backButton.disabled = this.currentIndex === 0;
			this.nextButton.hidden = isCompletionStep;
			this.nextButton.disabled = !this.hasAnswerForCurrentQuestion();
		}

		hasAnswerForCurrentQuestion() {
			const currentQuestion = this.questions[this.currentIndex];

			if (!currentQuestion) {
				return false;
			}

			return Object.prototype.hasOwnProperty.call(this.answers, currentQuestion.id);
		}

		calculateResult() {
			const score = Object.values(this.answers).filter(Boolean).length;
			const stopPositive = ['snoring', 'fatigue', 'observed', 'pressure'].filter((key) => this.answers[key]).length;
			const highRiskByCriteria = stopPositive >= 2 && (this.answers.bmi || this.answers.neck || this.answers.gender);

				if (score >= 5 || highRiskByCriteria) {
					return {
						score,
						risk: 'high',
						label: this.config.riskLabels.high,
						title: 'Wysokie ryzyko bezdechu sennego',
						message: this.config.messages.high,
						reason: '',
					};
				}

			if (score >= 3) {
				return {
					score,
					risk: 'moderate',
					label: this.config.riskLabels.moderate,
					title: 'Umiarkowane ryzyko bezdechu sennego',
					message: this.config.messages.moderate,
					reason: '',
				};
			}

			return {
				score,
				risk: 'low',
				label: this.config.riskLabels.low,
				title: 'Niskie ryzyko bezdechu sennego',
				message: this.config.messages.low,
				reason: '',
			};
		}

		renderResult(result) {
			this.element.classList.add('is-showing-result');
			this.flow.setAttribute('aria-hidden', 'true');
			this.resultPanel.hidden = false;
			this.resultPanel.innerHTML = `
				<div class="wsaq__result-card wsaq__result-card--${this.escape(result.risk)}">
					<div class="wsaq__result-meta">
						<span class="wsaq__result-pill">${this.escape(result.label)}</span>
						<span class="wsaq__result-score">${this.escape(String(result.score))} / ${this.escape(String(this.questions.length))}</span>
					</div>
					<h3 class="wsaq__result-title">${this.escape(result.title)}</h3>
					<p class="wsaq__result-text">${this.escape(result.message)}</p>
					${result.reason ? `<p class="wsaq__result-reason">${this.escape(result.reason)}</p>` : ''}
					<div class="wsaq__cta-wrap">
						<button type="button" class="wsaq__restart-button">${this.escape(this.config.labels.startAgain)}</button>
						${this.renderCta()}
					</div>
				</div>
			`;

			const restartButton = this.resultPanel.querySelector('.wsaq__restart-button');
			restartButton.addEventListener('click', () => {
				this.answers = {};
				this.currentIndex = 0;
				this.hideResult();
				this.render();
			});
		}

		hideResult() {
			this.element.classList.remove('is-showing-result');
			this.flow.removeAttribute('aria-hidden');
			this.resultPanel.hidden = true;
			this.resultPanel.innerHTML = '';
		}

		renderCta() {
			return `
				<a class="wsaq__cta-button" href="/sklep/" target="_blank" rel="noopener noreferrer">
					${this.escape(this.config.ctaLabel)}
				</a>
			`;
		}

		escape(value) {
			return String(value)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#039;');
		}

		escapeAttribute(value) {
			return this.escape(value);
		}
	}

	document.querySelectorAll(SELECTOR).forEach((element) => {
		new SleepApneaQuiz(element);
	});
})();
