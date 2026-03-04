import { useState, useEffect } from "react";

// Global variable to capture the event if it fires before the hook is mounted
let deferredPromptGlobal = null;

// Listen for the event globally as early as possible
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPromptGlobal = e;
        console.log("'beforeinstallprompt' event was captured globally.");
        // Dispatch a custom event to notify any mounted hooks
        window.dispatchEvent(new CustomEvent("pwascaninstall"));
    });
}

/**
 * Custom hook to handle PWA installation.
 * Provides a function to trigger the native install prompt.
 */
export const usePWAInstall = () => {
    const [isInstallable, setIsInstallable] = useState(!!deferredPromptGlobal);

    useEffect(() => {
        const handleScan = () => {
            setIsInstallable(!!deferredPromptGlobal);
        };

        window.addEventListener("pwascaninstall", handleScan);

        const appInstalledHandler = () => {
            console.log("PWA was installed");
            deferredPromptGlobal = null;
            setIsInstallable(false);
        };

        window.addEventListener("appinstalled", appInstalledHandler);

        // Initial check
        if (deferredPromptGlobal) {
            setIsInstallable(true);
        }

        return () => {
            window.removeEventListener("pwascaninstall", handleScan);
            window.removeEventListener("appinstalled", appInstalledHandler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPromptGlobal) {
            // If already installed, don't show any message, just log it.
            if (
                window.matchMedia("(display-mode: standalone)").matches ||
                window.navigator.standalone === true
            ) {
                console.log("App is already installed.");
            } else {
                console.log("Installation prompt is not yet available.");
            }
            return;
        }

        // Show the install prompt
        try {
            deferredPromptGlobal.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPromptGlobal.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // Clear the prompt
            deferredPromptGlobal = null;
            setIsInstallable(false);
        } catch (error) {
            console.error("Error triggering PWA install prompt:", error);
        }
    };

    return { isInstallable, handleInstallClick };
};
