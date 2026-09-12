<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EntityController;
use App\Http\Controllers\Api\EntityBodySnapshotController;
use App\Http\Controllers\Api\CharacterController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\ItemImageController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\ProductImportController;
use App\Http\Controllers\Api\ProductImportTraceController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\PersonaImageController;
use App\Http\Controllers\Api\SavingsTargetController;
use App\Http\Controllers\Api\TimelineEventController;
use App\Http\Controllers\Api\WorkspaceDocumentController;

Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::put('auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('auth/password', [AuthController::class, 'updatePassword']);

    Route::get('workspace', [WorkspaceDocumentController::class, 'index']);
    Route::put('workspace', [WorkspaceDocumentController::class, 'upsert']);
    Route::post('workspace/import', [WorkspaceDocumentController::class, 'import']);

    Route::post('media/import-url', [MediaController::class, 'importFromUrl']);
    Route::post('product-import/parse', [ProductImportController::class, 'parseFromUrl']);
    Route::post('product-import/selection', [ProductImportTraceController::class, 'reportSelection']);

    Route::get('exchange-rates', [ExchangeRateController::class, 'index']);
    Route::get('category', [CategoryController::class, 'index']);
    Route::post('category', [CategoryController::class, 'store']);
    Route::get('expense-category', [ExpenseCategoryController::class, 'index']);
    Route::post('expense-category', [ExpenseCategoryController::class, 'store']);
    Route::apiResource('entity', EntityController::class);
    Route::get('entity/{entity}/body-snapshots', [EntityBodySnapshotController::class, 'index']);
    Route::get('entity/{entity}/body-snapshots/prompt-snippet', [EntityBodySnapshotController::class, 'promptSnippet']);
    Route::post('entity/{entity}/body-snapshots', [EntityBodySnapshotController::class, 'store']);
    Route::put('entity/{entity}/body-snapshots/{bodySnapshot}', [EntityBodySnapshotController::class, 'update']);
    Route::delete('entity/{entity}/body-snapshots/{bodySnapshot}', [EntityBodySnapshotController::class, 'destroy']);

    Route::get('persona-vision/status', [PersonaImageController::class, 'status']);
    Route::post('entity/{entity}/avatar', [PersonaImageController::class, 'uploadAvatar']);
    Route::delete('entity/{entity}/avatar', [PersonaImageController::class, 'clearAvatar']);
    Route::post('entity/{entity}/avatar/generate', [PersonaImageController::class, 'generateAvatar']);
    Route::post('entity/{entity}/try-on', [PersonaImageController::class, 'tryOn']);
    Route::get('entity/{entity}/try-ons', [PersonaImageController::class, 'tryOnHistory']);
    Route::apiResource('character', CharacterController::class)->except(['index']);
    Route::post('item/{item}/duplicate', [ItemController::class, 'duplicate']);
    Route::apiResource('item', ItemController::class);
    Route::apiResource('timeline-event', TimelineEventController::class);
    Route::get('savings-target', [SavingsTargetController::class, 'index']);
    Route::post('savings-target', [SavingsTargetController::class, 'store']);
    Route::put('savings-target/{savingsTarget}', [SavingsTargetController::class, 'update']);
    Route::delete('savings-target/{savingsTarget}', [SavingsTargetController::class, 'destroy']);
    Route::put('savings-target/{savingsTarget}/included-assets', [SavingsTargetController::class, 'updateIncludedAssets']);
    Route::post('savings-target/{savingsTarget}/record-progress', [SavingsTargetController::class, 'recordProgress']);
    Route::put('savings-target/{savingsTarget}/progress-snapshots', [SavingsTargetController::class, 'updateProgressSnapshots']);
    Route::post('savings-target/{savingsTarget}/set-primary', [SavingsTargetController::class, 'setPrimary']);
    Route::get('item/{item}/images/{itemImage}/facing', [ItemImageController::class, 'detectFacing']);
    Route::post('item/{item}/images/{itemImage}/orient-right', [ItemImageController::class, 'orientToRight']);
    Route::get('/test', fn () => 'ok');
});
