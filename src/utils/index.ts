import extension from '../extension';

function waitForElement<TElement extends Element = HTMLElement>(
  selector: string,
  options: {
    timeout?: number;
    parentNode?: ParentNode;
  } = {},
): Promise<TElement> {
  extension.log('waitForElement');
  const { timeout = 3000, parentNode = document } = options;

  return new Promise((resolve, reject) => {
    const element = parentNode.querySelector<TElement>(selector);

    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        Array.from(mutation.addedNodes).forEach((addedNode) => {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            const targetElement = (addedNode as Element).querySelector<TElement>(selector);

            if (targetElement) {
              observer.disconnect();
              resolve(targetElement);
            }
          }
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout: Element not found with selector "${selector}"`));
    }, timeout);
  });
}

// eslint-disable-next-line import/prefer-default-export
export { waitForElement };
